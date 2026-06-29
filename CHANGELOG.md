# MC Time 3.9 LTS - Build 304

- Code.gs réduit aux entrées API doGet/doPost.
- Nouveau découpage : Employes, Pointages, Calcul, Dashboard, Export, Installer, Utils, Theme, Tests.
- Calcul journalier : source des périodes.
- Synthèse : source des totaux journaliers.
- Dashboard : lit uniquement la Synthèse et les derniers pointages.
- Export CSV : basé sur Synthèse ou Calcul journalier.
- Suppression du logo distant pour éviter les erreurs #REF Google Sheets.
