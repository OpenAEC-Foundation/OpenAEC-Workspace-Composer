# Claude Code Prompt — Workspace Manager Feature

Kopieer onderstaand blok naar Claude Code als startprompt.

---

```
Ik wil een "Manage" modus toevoegen aan de OpenAEC Workspace Composer. Lees eerst deze bestanden om de feature te begrijpen:

1. `.claude-handoff/SPEC.md` — volledige feature specificatie
2. `.claude-handoff/ORCHESTRATOR-DATA-REFERENCE.md` — voorbeelddata
3. `src/layouts/AppLayout.tsx` — bestaande sidebar + mode toggle
4. `src/index.tsx` — routing
5. `src/stores/app.store.ts` — mode state (Simple/Advanced, wordt drie-weg)
6. `src-tauri/src/lib.rs` — command registratie
7. `src-tauri/src/config_writer.rs` — bestaand patroon voor file I/O
8. `src/pages/DashboardPage.tsx` — voorbeeld page-structuur
9. `src/styles/tokens.css` — design tokens

Na het lezen: begin met Fase 1 uit de spec:
1. Maak `src-tauri/src/manager.rs` met scan_workspace(), read_project_claude_md(), read_session_summary(), read_lessons_learned(), read_context_file(), open_in_terminal(), open_in_explorer()
2. Registreer alle commands in `lib.rs`
3. Maak `src/stores/manager.store.ts` (SolidJS signals, invoke() calls)
4. Breid de mode toggle uit van twee-weg naar drie-weg (Simple | Advanced | Manage) in `app.store.ts`
5. Voeg de Manage sidebar-groep toe in `AppLayout.tsx`
6. Voeg routes toe in `index.tsx`
7. Maak `src/styles/manager.css`
8. Maak `ManageOverviewPage.tsx` als eerste pagina

Belangrijk:
- Dit is SolidJS, NIET React. Gebruik createSignal/createMemo, <Show>/<For>, geen useState/useEffect
- Gebruik invoke() van @tauri-apps/api/core voor Rust command calls
- Volg het bestaande CSS patroon: modulaire bestanden, design tokens uit tokens.css
- De app draait op Windows. Paden gebruiken backslashes. De Rust backend handelt dit af.
- We zitten op branch: feat/workspace-manager

Start met `cargo check` na de Rust wijzigingen om te verifiëren dat het compileert.
```
