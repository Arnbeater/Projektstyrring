# Projektstyring — Gantt & Tidslinje

Projektstyringsværktøj med Gantt-diagram, tidslinje, opgaveliste og team-login via Firebase.

## Hurtig-start: Deploy til GitHub Pages

### 1. Opret GitHub-repo

1. Gå til [github.com/new](https://github.com/new)
2. Navngiv repo'et fx `projektstyring`
3. Sæt det til **Public** (kræves til gratis GitHub Pages)
4. Klik **Create repository**

### 2. Upload filerne

Du har to muligheder:

**Mulighed A: Via GitHub-interfacet (nemmest)**
1. Klik **"uploading an existing file"** på den tomme repo-side
2. Træk hele indholdet af denne mappe ind (IKKE selve mappen, men filerne i den)
3. Klik **Commit changes**

**Mulighed B: Via terminal**
```bash
cd projektstyring-github
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DIT-BRUGERNAVN/projektstyring.git
git push -u origin main
```

### 3. Aktivér GitHub Pages

1. Gå til repo'et → **Settings** → **Pages** (i venstre sidebar)
2. Under **Source** vælg **GitHub Actions**
3. Det er det! GitHub kører automatisk build + deploy

### 4. Vent 2-3 minutter

1. Gå til **Actions**-fanen og se at workflow'et kører
2. Når det er grønt, er din app live på:
   `https://DIT-BRUGERNAVN.github.io/projektstyring/`

## Firebase-opsætning (allerede gjort)

Din Firebase-config er allerede indsat i `src/App.jsx`. Husk at:

1. Oprette brugere i [Firebase Console](https://console.firebase.google.com) → Authentication → Add user
2. Firestore-regler er i test mode (OK til start, men lås ned senere)

## Lokal udvikling

```bash
npm install
npm run dev
```

Åbner på `http://localhost:5173`

## Opdatering

Bare push til `main`-branch, så deployer GitHub automatisk:

```bash
git add .
git commit -m "Opdatering"
git push
```
