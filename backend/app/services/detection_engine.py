"""
PhishGuard AI — Rule-Based Phishing Detection Engine
------------------------------------------------------
Architecture: modular signal pipeline that produces a transparent risk score.
Each detector emits DetectionSignal objects; the aggregator combines them into
a final AnalysisResult.  The design allows a trained ML model to override or
supplement the rule-based score in a later integration phase.
"""

from __future__ import annotations

import re
import email
import email.policy
from email import message_from_string
from email.utils import parseaddr, getaddresses
from dataclasses import dataclass, field
from typing import List, Optional
from urllib.parse import urlparse
import tldextract


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class DetectionSignal:
    category: str          # e.g. "sender", "language", "url", "header"
    description: str       # human-readable explanation
    weight: float          # contribution to risk score (0–100 scale)
    evidence: str = ""     # raw evidence snippet


@dataclass
class ExtractedURL:
    url: str
    display_text: str = ""
    domain: str = ""
    is_suspicious: bool = False
    reason: str = ""


@dataclass
class AttachmentInfo:
    filename: str
    content_type: str
    size_bytes: int = 0
    is_suspicious: bool = False
    reason: str = ""


@dataclass
class ForensicData:
    sender_display_name: str = ""
    sender_address: str = ""
    reply_to: str = ""
    return_path: str = ""
    received_hops: List[str] = field(default_factory=list)
    message_id: str = ""
    x_originating_ip: str = ""
    spf_result: str = "not-checked"
    dkim_result: str = "not-checked"
    dmarc_result: str = "not-checked"
    auth_note: str = "Authentication results parsed from headers only; live DNS checks not performed."
    routing_summary: str = ""


@dataclass
class AnalysisResult:
    classification: str          # safe | suspicious | phishing
    risk_score: float            # 0–100
    severity: str                # low | medium | high | critical
    summary: str
    signals: List[DetectionSignal]
    extracted_urls: List[ExtractedURL]
    attachments: List[AttachmentInfo]
    forensic_data: ForensicData
    recommended_actions: List[str]
    analysis_mode: str = "rule-based (demo)"
    subject: str = ""
    sender: str = ""
    recipient: str = ""
    raw_headers: str = ""


# ---------------------------------------------------------------------------
# Suspicious keyword lists
# ---------------------------------------------------------------------------

URGENT_KEYWORDS = [
    r"\burgent\b", r"\bimmediately\b", r"\bact now\b", r"\bexpires?\b",
    r"\bdeadline\b", r"\blast chance\b", r"\blimited time\b", r"\basap\b",
    r"\bwithin 24 hours\b", r"\bwithin 48 hours\b", r"\baction required\b",
    r"\baccount suspended\b", r"\baccount will be (closed|terminated|suspended)\b",
    r"\bverify (your|account|identity)\b", r"\bconfirm (your|account|identity)\b",
]

CREDENTIAL_KEYWORDS = [
    r"\bpassword\b", r"\bpin\b", r"\botp\b", r"\bone.time.pass\b",
    r"\bcredit card\b", r"\bdebit card\b", r"\bbank account\b",
    r"\bsocial security\b", r"\bssn\b", r"\btax id\b",
    r"\benter your details\b", r"\bupdate your (payment|billing|account)\b",
    r"\bverify your (card|bank|payment)\b", r"\bprovide your\b",
]

THREAT_KEYWORDS = [
    r"\bsuspended\b", r"\blocked\b", r"\blimited\b", r"\bunusual activity\b",
    r"\bunauthorized (access|login|activity)\b", r"\bsecurity (alert|notice|warning)\b",
    r"\byour account (has been|will be)\b", r"\bfailed (login|attempt)\b",
    r"\bsuspicious (activity|login|access)\b",
]

IMPERSONATION_BRANDS = [
    "paypal", "amazon", "apple", "microsoft", "google", "netflix", "facebook",
    "instagram", "twitter", "linkedin", "dropbox", "chase", "bank of america",
    "wells fargo", "citibank", "irs", "fedex", "ups", "dhl", "usps",
    "ebay", "walmart", "target", "coinbase", "binance",
]

SUSPICIOUS_TLD = {
    ".xyz", ".tk", ".ml", ".ga", ".cf", ".gq", ".pw", ".top", ".club",
    ".work", ".live", ".online", ".site", ".space", ".info", ".biz",
}

SUSPICIOUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".scr", ".vbs", ".js", ".jar", ".ps1",
    ".pif", ".com", ".msi", ".hta", ".wsf", ".iso", ".img",
    ".zip",  # flagged with lower weight
}


# ---------------------------------------------------------------------------
# Header parsing helpers
# ---------------------------------------------------------------------------

def _parse_headers_and_body(raw_content: str) -> tuple[dict, str, str]:
    """Return (header_dict, body_text, raw_headers_str)."""
    msg = message_from_string(raw_content, policy=email.policy.compat32)
    headers: dict = {}
    raw_lines: list[str] = []
    for key in msg.keys():
        val = msg[key] or ""
        headers.setdefault(key.lower(), [])
        if isinstance(headers[key.lower()], list):
            headers[key.lower()].append(val)
        raw_lines.append(f"{key}: {val}")

    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            ct = part.get_content_type()
            if ct in ("text/plain", "text/html"):
                try:
                    body += part.get_payload(decode=True).decode("utf-8", errors="replace")
                except Exception:
                    pass
    else:
        try:
            body = msg.get_payload(decode=True).decode("utf-8", errors="replace") or ""
        except Exception:
            body = str(msg.get_payload()) or ""

    return headers, body, "\n".join(raw_lines)


def _extract_attachments(raw_content: str) -> List[AttachmentInfo]:
    attachments = []
    msg = message_from_string(raw_content, policy=email.policy.compat32)
    for part in msg.walk():
        disposition = part.get("Content-Disposition", "")
        if "attachment" in disposition.lower():
            filename = part.get_filename() or "unknown"
            ctype = part.get_content_type()
            payload = part.get_payload(decode=True) or b""
            ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
            suspicious = ext in SUSPICIOUS_EXTENSIONS
            reason = f"Executable or dangerous file extension: {ext}" if suspicious else ""
            attachments.append(AttachmentInfo(
                filename=filename,
                content_type=ctype,
                size_bytes=len(payload),
                is_suspicious=suspicious,
                reason=reason,
            ))
    return attachments


def _extract_forensic(headers: dict, raw_headers: str) -> ForensicData:
    def first(key: str) -> str:
        v = headers.get(key, [""])
        return v[0] if v else ""

    from_raw = first("from")
    display_name, sender_addr = parseaddr(from_raw)
    reply_to = first("reply-to")
    return_path = first("return-path")
    message_id = first("message-id")
    x_ip = first("x-originating-ip")

    received_hops = headers.get("received", [])

    # Try to parse SPF/DKIM/DMARC from Authentication-Results header
    auth_results = first("authentication-results")
    spf = dkim = dmarc = "not-checked"
    if auth_results:
        if "spf=pass" in auth_results.lower():
            spf = "pass"
        elif "spf=fail" in auth_results.lower():
            spf = "fail"
        elif "spf=softfail" in auth_results.lower():
            spf = "softfail"
        elif "spf=neutral" in auth_results.lower():
            spf = "neutral"

        if "dkim=pass" in auth_results.lower():
            dkim = "pass"
        elif "dkim=fail" in auth_results.lower():
            dkim = "fail"

        if "dmarc=pass" in auth_results.lower():
            dmarc = "pass"
        elif "dmarc=fail" in auth_results.lower():
            dmarc = "fail"

    routing = f"{len(received_hops)} mail server hop(s) detected." if received_hops else "No routing information found."

    return ForensicData(
        sender_display_name=display_name,
        sender_address=sender_addr,
        reply_to=reply_to,
        return_path=return_path,
        received_hops=received_hops,
        message_id=message_id,
        x_originating_ip=x_ip,
        spf_result=spf,
        dkim_result=dkim,
        dmarc_result=dmarc,
        routing_summary=routing,
    )


# ---------------------------------------------------------------------------
# URL extraction
# ---------------------------------------------------------------------------

URL_RE = re.compile(
    r'https?://[^\s<>"\')\]]+',
    re.IGNORECASE,
)

# Patterns that look like URL text mismatches in HTML anchors
HREF_TEXT_RE = re.compile(
    r'href=["\']([^"\']+)["\'][^>]*>([^<]{3,80})</a>',
    re.IGNORECASE,
)


def _extract_urls(text: str) -> List[ExtractedURL]:
    results: dict[str, ExtractedURL] = {}

    # Plain URLs
    for m in URL_RE.finditer(text):
        url = m.group(0).rstrip(".,;")
        parsed = urlparse(url)
        ext = tldextract.extract(url)
        domain = f"{ext.domain}.{ext.suffix}" if ext.suffix else parsed.netloc
        tld = f".{ext.suffix}" if ext.suffix else ""
        suspicious = tld in SUSPICIOUS_TLD
        reason = f"Suspicious TLD: {tld}" if suspicious else ""
        results[url] = ExtractedURL(url=url, domain=domain, is_suspicious=suspicious, reason=reason)

    # Anchor href vs visible text mismatches
    for m in HREF_TEXT_RE.finditer(text):
        href, visible = m.group(1), m.group(2).strip()
        if href in results:
            eu = results[href]
        else:
            parsed = urlparse(href)
            ext = tldextract.extract(href)
            domain = f"{ext.domain}.{ext.suffix}" if ext.suffix else parsed.netloc
            tld = f".{ext.suffix}" if ext.suffix else ""
            suspicious = tld in SUSPICIOUS_TLD
            eu = ExtractedURL(url=href, domain=domain, is_suspicious=suspicious, reason="")

        # Check if visible text is a different URL
        if re.match(r'https?://', visible):
            href_dom = tldextract.extract(href)
            vis_dom = tldextract.extract(visible)
            if href_dom.domain != vis_dom.domain:
                eu.is_suspicious = True
                eu.reason = f"Display text ({visible[:40]}) differs from actual URL domain"
        eu.display_text = visible
        results[href] = eu

    return list(results.values())


# ---------------------------------------------------------------------------
# Individual detectors
# ---------------------------------------------------------------------------

def _detect_sender_issues(
    headers: dict,
    forensic: ForensicData,
    raw_content: str,
) -> List[DetectionSignal]:
    signals = []
    sender_addr = forensic.sender_address.lower()
    display_name = forensic.sender_display_name.lower()
    reply_to = forensic.reply_to.lower()
    return_path = forensic.return_path.lower()

    if not sender_addr:
        signals.append(DetectionSignal(
            "sender", "No sender address detected", 15.0,
        ))

    ext = tldextract.extract(sender_addr)
    sender_domain = f"{ext.domain}.{ext.suffix}" if ext.suffix else ""
    sender_tld = f".{ext.suffix}" if ext.suffix else ""

    # Display-name impersonation
    for brand in IMPERSONATION_BRANDS:
        if brand in display_name and brand not in sender_domain:
            signals.append(DetectionSignal(
                "sender",
                f"Display name claims to be '{brand}' but sender domain is '{sender_domain}'",
                30.0,
                evidence=f"From: {forensic.sender_display_name} <{sender_addr}>",
            ))
            break

    # Suspicious TLD in sender
    if sender_tld in SUSPICIOUS_TLD:
        signals.append(DetectionSignal(
            "sender",
            f"Sender uses suspicious top-level domain: {sender_tld}",
            20.0,
            evidence=sender_addr,
        ))

    # Reply-to mismatch
    if reply_to and reply_to != sender_addr:
        _, rto_addr = parseaddr(reply_to)
        if rto_addr and rto_addr.lower() != sender_addr:
            ext_r = tldextract.extract(rto_addr)
            rto_domain = f"{ext_r.domain}.{ext_r.suffix}"
            if rto_domain != sender_domain:
                signals.append(DetectionSignal(
                    "header",
                    f"Reply-To domain ({rto_domain}) differs from sender domain ({sender_domain})",
                    25.0,
                    evidence=f"Reply-To: {reply_to}",
                ))

    # Return-path mismatch
    if return_path:
        _, rp_addr = parseaddr(return_path)
        if rp_addr:
            ext_rp = tldextract.extract(rp_addr)
            rp_domain = f"{ext_rp.domain}.{ext_rp.suffix}"
            if rp_domain and rp_domain != sender_domain:
                signals.append(DetectionSignal(
                    "header",
                    f"Return-Path domain ({rp_domain}) differs from sender domain ({sender_domain})",
                    15.0,
                    evidence=f"Return-Path: {return_path}",
                ))

    return signals


def _detect_language_signals(body: str) -> List[DetectionSignal]:
    signals = []
    body_lower = body.lower()

    urgent_hits = [kw for kw in URGENT_KEYWORDS if re.search(kw, body_lower)]
    if len(urgent_hits) >= 3:
        signals.append(DetectionSignal(
            "language",
            f"Multiple urgency indicators detected ({len(urgent_hits)} patterns)",
            20.0,
            evidence=", ".join(urgent_hits[:5]),
        ))
    elif len(urgent_hits) >= 1:
        signals.append(DetectionSignal(
            "language",
            f"Urgency language detected: {urgent_hits[0]}",
            10.0,
            evidence=urgent_hits[0],
        ))

    cred_hits = [kw for kw in CREDENTIAL_KEYWORDS if re.search(kw, body_lower)]
    if len(cred_hits) >= 2:
        signals.append(DetectionSignal(
            "language",
            f"Credential harvesting language detected ({len(cred_hits)} patterns)",
            30.0,
            evidence=", ".join(cred_hits[:5]),
        ))
    elif len(cred_hits) == 1:
        signals.append(DetectionSignal(
            "language",
            f"Sensitive data request detected: {cred_hits[0]}",
            15.0,
            evidence=cred_hits[0],
        ))

    threat_hits = [kw for kw in THREAT_KEYWORDS if re.search(kw, body_lower)]
    if threat_hits:
        signals.append(DetectionSignal(
            "language",
            f"Threatening language detected ({len(threat_hits)} patterns)",
            15.0,
            evidence=", ".join(threat_hits[:3]),
        ))

    for brand in IMPERSONATION_BRANDS:
        if brand in body_lower:
            signals.append(DetectionSignal(
                "content",
                f"Email body mentions brand '{brand}' — possible impersonation",
                8.0,
                evidence=brand,
            ))
            break  # report first match only

    return signals


def _detect_url_signals(urls: List[ExtractedURL]) -> List[DetectionSignal]:
    signals = []
    suspicious_urls = [u for u in urls if u.is_suspicious]
    if suspicious_urls:
        signals.append(DetectionSignal(
            "url",
            f"{len(suspicious_urls)} suspicious URL(s) detected",
            25.0 if len(suspicious_urls) >= 2 else 15.0,
            evidence=", ".join(u.url[:60] for u in suspicious_urls[:3]),
        ))

    for u in urls:
        if u.display_text and re.search(r"click here|login|verify|confirm|update", u.display_text, re.I):
            signals.append(DetectionSignal(
                "url",
                f"Deceptive link text: '{u.display_text}'",
                10.0,
                evidence=u.url[:80],
            ))
            break

    return signals


def _detect_attachment_signals(attachments: List[AttachmentInfo]) -> List[DetectionSignal]:
    signals = []
    for att in attachments:
        if att.is_suspicious:
            ext = att.filename.rsplit(".", 1)[-1].lower() if "." in att.filename else ""
            weight = 35.0 if ext in {"exe", "bat", "scr", "vbs", "ps1", "cmd"} else 15.0
            signals.append(DetectionSignal(
                "attachment",
                f"Suspicious attachment: {att.filename}",
                weight,
                evidence=att.filename,
            ))
    return signals


def _detect_auth_failures(forensic: ForensicData) -> List[DetectionSignal]:
    signals = []
    if forensic.spf_result in ("fail", "softfail"):
        signals.append(DetectionSignal(
            "authentication",
            f"SPF check result: {forensic.spf_result} (sender may be spoofed)",
            20.0,
            evidence=f"SPF={forensic.spf_result}",
        ))
    if forensic.dkim_result == "fail":
        signals.append(DetectionSignal(
            "authentication",
            "DKIM signature verification failed",
            20.0,
            evidence="DKIM=fail",
        ))
    if forensic.dmarc_result == "fail":
        signals.append(DetectionSignal(
            "authentication",
            "DMARC policy check failed — email may be spoofed",
            25.0,
            evidence="DMARC=fail",
        ))
    return signals


# ---------------------------------------------------------------------------
# Score aggregation
# ---------------------------------------------------------------------------

def _compute_score(signals: List[DetectionSignal]) -> float:
    """Combine signal weights into a 0–100 risk score (diminishing returns)."""
    if not signals:
        return 0.0
    total = sum(s.weight for s in signals)
    # Apply diminishing returns: each point above 50 is worth half
    if total <= 50:
        return round(min(total, 100), 1)
    else:
        return round(min(50 + (total - 50) * 0.6, 100), 1)


def _classify(score: float, signals: List[DetectionSignal]) -> tuple[str, str]:
    """Return (classification, severity)."""
    has_auth_fail = any(s.category == "authentication" for s in signals)
    has_exec_attachment = any(
        s.category == "attachment" and s.weight >= 35 for s in signals
    )

    if score >= 70 or has_auth_fail or has_exec_attachment:
        classification = "phishing"
    elif score >= 30:
        classification = "suspicious"
    else:
        classification = "safe"

    if score >= 80:
        severity = "critical"
    elif score >= 60:
        severity = "high"
    elif score >= 30:
        severity = "medium"
    else:
        severity = "low"

    return classification, severity


def _build_recommendations(
    classification: str,
    signals: List[DetectionSignal],
    urls: List[ExtractedURL],
    attachments: List[AttachmentInfo],
) -> List[str]:
    recs = []
    if classification == "phishing":
        recs.append("Do NOT click any links or open attachments in this email.")
        recs.append("Report this email to your IT/security team immediately.")
        recs.append("Delete the email from your inbox and trash.")
        recs.append("If you already clicked a link, change your passwords and enable 2FA.")
    elif classification == "suspicious":
        recs.append("Exercise caution — verify the sender before taking any action.")
        recs.append("Do not provide personal or financial information.")
        recs.append("Contact the purported sender via a known phone number or website.")
    else:
        recs.append("Email appears safe based on automated analysis.")
        recs.append("Always remain vigilant — automated tools can miss new phishing techniques.")

    if any(u.is_suspicious for u in urls):
        recs.append("Do not visit any flagged URLs; copy them for investigation only.")
    if any(a.is_suspicious for a in attachments):
        recs.append("Do not open or execute any flagged attachments.")
    return recs


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def analyze_email(
    raw_content: str = "",
    sender_input: str = "",
    subject_input: str = "",
    headers_only: str = "",
) -> AnalysisResult:
    """
    Main analysis entry point.

    Parameters
    ----------
    raw_content  : Full raw email text (RFC 2822) or just body paste.
    sender_input : Manually entered sender address (used if headers not present).
    subject_input: Manually entered subject (used if headers not present).
    headers_only : Paste of only the header block.
    """
    # Merge inputs
    if headers_only and not raw_content:
        raw_content = headers_only

    if raw_content.strip():
        headers, body, raw_headers_str = _parse_headers_and_body(raw_content)
    else:
        headers, body, raw_headers_str = {}, "", ""

    # Prefer header-extracted values; fall back to manual inputs
    def first_header(key: str) -> str:
        v = headers.get(key, [""])
        return (v[0] if v else "").strip()

    subject = first_header("subject") or subject_input
    from_raw = first_header("from") or sender_input
    _, sender_addr = parseaddr(from_raw)
    sender = sender_addr or sender_input
    recipient = first_header("to") or ""

    # If no body parsed but raw_content provided, treat whole thing as body
    if not body:
        body = raw_content

    # Build forensic data
    forensic = _extract_forensic(headers, raw_headers_str)
    if not forensic.sender_address and sender:
        forensic.sender_address = sender

    # Extract URLs and attachments
    urls = _extract_urls(body)
    attachments = _extract_attachments(raw_content)

    # Run detectors
    signals: List[DetectionSignal] = []
    signals += _detect_sender_issues(headers, forensic, raw_content)
    signals += _detect_language_signals(body)
    signals += _detect_url_signals(urls)
    signals += _detect_attachment_signals(attachments)
    signals += _detect_auth_failures(forensic)

    score = _compute_score(signals)
    classification, severity = _classify(score, signals)
    recommendations = _build_recommendations(classification, signals, urls, attachments)

    summary_map = {
        "phishing": f"This email exhibits {len(signals)} phishing indicator(s). Risk score {score}/100. Treat as malicious.",
        "suspicious": f"This email has {len(signals)} suspicious indicator(s). Risk score {score}/100. Verify before acting.",
        "safe": f"No major threats detected. Risk score {score}/100. Standard caution advised.",
    }

    return AnalysisResult(
        classification=classification,
        risk_score=score,
        severity=severity,
        summary=summary_map[classification],
        signals=signals,
        extracted_urls=urls,
        attachments=attachments,
        forensic_data=forensic,
        recommended_actions=recommendations,
        subject=subject,
        sender=sender,
        recipient=recipient,
        raw_headers=raw_headers_str or headers_only,
    )
