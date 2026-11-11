# Audio Anomaly / FXAA

A browser audio-graph prototype, now in product discovery for a sound-design platform with transferable Unreal MetaSounds skills.

The current app identifies itself as FXAA v0.7.07. Audio Anomaly is the new repository name. Final product naming remains open.

## Project records

- [Product brief](PRD.md): draft direction, scope, and open product questions.
- [Discovery plan](PLAN.md): current status and the next bounded tasks.
- [Project review](docs/PROJECT_REVIEW.md): source findings, current node inventory, and sample analysis.
- [Historical architecture report](.Documents/Reports/FXAA_Architecture_Report.md): earlier context, not a current specification.

The supplied `agent-project-management/` directory is reference material. Its starter files are templates, not adopted project requirements.

## Run locally

From the repository directory, start a static server:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open <http://localhost:8000>. The app uses JavaScript modules, Web Audio, and AudioWorklets. CSS and fonts require external network access.

There is no package manifest, build command, or automated test suite in this baseline.

## Hosting and samples

Netlify lists [fxaa](https://fxaa.netlify.app) and [fxaa-tester](https://fxaa-tester.netlify.app). Their relationship to this checkout needs verification.

`sample graph.txt` contains JSON from exploratory work. It is a reference sample, not a final preset or product requirement.

The app offers JSON import/export and WAV export. It does not currently expose a graph API or MCP server.
