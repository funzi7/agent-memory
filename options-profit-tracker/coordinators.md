# Coordinators board — two chat coordinators split the work.
# Each coordinator READS this + the head of state.md BEFORE writing any prompt.
# Claim format: [COORDINATOR] SCOPE: <features> — FILES: <files> — <date>
# RULE: if your planned files intersect the OTHER coordinator's FILES, do NOT run in parallel —
#       sequence the rounds. Build agents still lock per-file in in-progress.md (append before edit;
#       if a file is locked by the other agent, wait and retry until released).

[CLAUDE-CHAT] SCOPE: small features (round GO) —
  FILES: ui/screens/dashboard/DashboardScreen.kt, ui/screens/dashboard/StockRealizedScreen.kt,
         MainActivity.kt, notification/BootReceiver.kt (NEW), app/src/main/AndroidManifest.xml
  — 2026-06-22

[CHATGPT] SCOPE: (one big feature — claim here before issuing) —
  FILES: (must avoid the CLAUDE-CHAT files above. NOTE: a feature that adds a NEW nav screen/route
          touches MainActivity.kt + ui/navigation/Screen.kt → that collides with round GO, so run it
          AFTER GO, not in parallel.)
  —
