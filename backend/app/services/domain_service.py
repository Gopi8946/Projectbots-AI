"""
DOMAIN WHITELISTING SERVICE
Validates that widget requests come from approved domains only.
Protects against unauthorized embedding of chatbot widgets.
"""

from typing import List, Optional
from urllib.parse import urlparse


ALWAYS_ALLOWED = [
    "localhost",
    "127.0.0.1",
    "projectbots.ai",
    "www.projectbots.ai",
]


def extract_domain(url: str) -> Optional[str]:
    """Extract clean domain from a URL or Origin header."""
    if not url:
        return None
    try:
        # Handle cases where url doesn't have scheme
        if not url.startswith("http"):
            url = f"https://{url}"
        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        port = parsed.port
        # Include port if non-standard
        if port and port not in (80, 443):
            return f"{hostname}:{port}"
        return hostname
    except Exception:
        return None


def is_domain_allowed(
    origin: Optional[str],
    referer: Optional[str],
    allowed_domains: Optional[List[str]]
) -> tuple[bool, str]:
    """
    Check if request origin is in the allowed domains list.

    Returns: (is_allowed: bool, reason: str)
    """
    # Extract domain from Origin header first, then Referer
    request_domain = None

    if origin and origin != "null":
        request_domain = extract_domain(origin)
    elif referer:
        request_domain = extract_domain(referer)

    # If no origin/referer (e.g., direct API call, Postman, curl)
    # Allow it — could be a legitimate API integration
    if not request_domain:
        return True, "no_origin"

    # Always allow our own domains and localhost
    for always in ALWAYS_ALLOWED:
        if request_domain == always or request_domain.endswith(f".{always}"):
            return True, "always_allowed"

    # If owner hasn't set any allowed domains yet — allow all
    # (owner needs to configure domains in deploy tab)
    if not allowed_domains:
        return True, "no_restrictions_set"

    # Check against owner's approved domain list
    clean_allowed = [d.strip().lower().replace("https://", "").replace("http://", "").rstrip("/") for d in allowed_domains]

    request_clean = request_domain.lower()

    for domain in clean_allowed:
        # Exact match
        if request_clean == domain:
            return True, "exact_match"
        # Subdomain match (www.example.com matches example.com)
        if request_clean.endswith(f".{domain}"):
            return True, "subdomain_match"
        # Wildcard match if owner added *.example.com
        if domain.startswith("*.") and request_clean.endswith(domain[1:]):
            return True, "wildcard_match"

    return False, f"domain_not_allowed: {request_domain}"