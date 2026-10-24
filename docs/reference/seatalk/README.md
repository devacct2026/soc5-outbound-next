# SeaTalk Source References

Fetched from the public `outbound-project/soc-5-outbound` GitLab repository, default branch `main`, on 2026-10-24.

These files are reference material only. The rebuild requirements and decisions in this repository remain authoritative; do not import conflicting legacy workflow behavior or assume documented provider endpoints are currently enabled. Verify provider credentials and supported operations before integration. Configuration examples contain no copied secret values.

The `frontend/public/label-templates/` directory contains the source truck-label background images (`single_lh`, `coload_lh`, and `triload_lh`). The source repository contains no `PrintableTruckLabel` component by that exact name; these are assets, not a reusable React component.
