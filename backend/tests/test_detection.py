"""
Test suite for PhishGuard AI detection engine.
Run with: pytest tests/test_detection.py -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.detection_engine import analyze_email


def test_phishing_sample():
    """Fixture: phishing email with SPF fail, suspicious domain, credential harvesting."""
    with open("fixtures/phishing_sample.eml") as f:
        content = f.read()
    result = analyze_email(raw_content=content)
    assert result.classification == "phishing", f"Expected phishing, got {result.classification}"
    assert result.risk_score >= 60, f"Expected risk >= 60, got {result.risk_score}"
    assert result.severity in ("high", "critical")
    print(f"  Phishing: score={result.risk_score}, signals={len(result.signals)}")


def test_safe_sample():
    """Fixture: legitimate newsletter email with SPF/DKIM/DMARC pass."""
    with open("fixtures/safe_sample.eml") as f:
        content = f.read()
    result = analyze_email(raw_content=content)
    assert result.classification == "safe", f"Expected safe, got {result.classification}"
    assert result.risk_score < 30, f"Expected risk < 30, got {result.risk_score}"
    print(f"  Safe: score={result.risk_score}, signals={len(result.signals)}")


def test_suspicious_sample():
    """Fixture: suspicious email with brand impersonation and urgent language."""
    with open("fixtures/suspicious_sample.eml") as f:
        content = f.read()
    result = analyze_email(raw_content=content)
    assert result.classification in ("suspicious", "phishing"), \
        f"Expected suspicious or phishing, got {result.classification}"
    assert result.risk_score >= 25, f"Expected risk >= 25, got {result.risk_score}"
    print(f"  Suspicious: score={result.risk_score}, signals={len(result.signals)}")


def test_minimal_input():
    """Bare minimum input — just a sender and subject."""
    result = analyze_email(sender_input="test@example.com", subject_input="Hello")
    assert result.classification == "safe"
    assert result.risk_score < 20


def test_empty_input():
    """Empty input should not crash and should return safe with low score."""
    result = analyze_email()
    assert result.classification in ("safe", "suspicious")
    assert result.risk_score >= 0


def test_urgency_language():
    """Inline body with urgent credential-harvesting language."""
    body = """
    URGENT: Your bank account has been suspended.
    Please provide your password and credit card number immediately.
    Action required within 24 hours or your account will be terminated.
    Click here to verify: http://bank-verify.xyz/login
    """
    result = analyze_email(raw_content=body)
    assert result.risk_score >= 40, f"Expected risk >= 40, got {result.risk_score}"
    categories = {s.category for s in result.signals}
    assert "language" in categories


def test_url_extraction():
    """URL extraction and suspicious TLD detection."""
    body = "Please visit http://phishing-site.tk/steal or http://legitimate-site.com"
    result = analyze_email(raw_content=body)
    urls = [u.url for u in result.extracted_urls]
    assert any("phishing-site.tk" in u for u in urls)
    suspicious = [u for u in result.extracted_urls if u.is_suspicious]
    assert len(suspicious) >= 1


def test_display_name_impersonation():
    """Sender display name says PayPal but domain is not paypal.com."""
    raw = """From: PayPal Security <security@random-domain.xyz>
Subject: Verify your account
To: user@example.com

Your PayPal account needs verification.
"""
    result = analyze_email(raw_content=raw)
    categories = {s.category for s in result.signals}
    assert "sender" in categories


if __name__ == "__main__":
    tests = [
        test_phishing_sample,
        test_safe_sample,
        test_suspicious_sample,
        test_minimal_input,
        test_empty_input,
        test_urgency_language,
        test_url_extraction,
        test_display_name_impersonation,
    ]
    passed = 0
    for t in tests:
        try:
            t()
            print(f"  ✓ {t.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"  ✗ {t.__name__}: {e}")
        except Exception as e:
            print(f"  ✗ {t.__name__}: EXCEPTION {e}")
    print(f"\n{passed}/{len(tests)} tests passed")
