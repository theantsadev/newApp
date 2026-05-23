## Inputs de type file en React

Les inputs de type file servent a selectionner des fichiers depuis le poste utilisateur.
En React, on lit le fichier via l evenement `onChange` et on le recupere dans
`event.target.files`.

### Attributs utiles

- `type="file"` : active la selection de fichiers.
- `accept` : filtre les types de fichiers proposes par la boite de dialogue.
	Exemple: `.csv`, `.zip`, `image/*`.
- `multiple` : autorise la selection de plusieurs fichiers.
- `id` + `htmlFor` : associe le label a l input (clic sur le label ouvre la boite).

### Exemple simple (un seul fichier)

```jsx
import { useState } from "react";

export default function UploadCsv() {
	const [file, setFile] = useState(null);

	const handleChange = (event) => {
		const selected = event.target.files?.[0] || null;
		setFile(selected);
	};

	return (
		<div>
			<label htmlFor="csv-file">CSV Produits</label>
			<input
				id="csv-file"
				type="file"
				accept=".csv"
				onChange={handleChange}
			/>
			<p>Fichier selectionne: {file?.name || "-"}</p>
		</div>
	);
}
```

### Exemple multiple (plusieurs fichiers)

```jsx
import { useState } from "react";

export default function UploadZipImages() {
	const [files, setFiles] = useState([]);

	const handleChange = (event) => {
		const selected = Array.from(event.target.files || []);
		setFiles(selected);
	};

	return (
		<div>
			<label htmlFor="zip-files">ZIP Images</label>
			<input
				id="zip-files"
				type="file"
				accept=".zip"
				multiple
				onChange={handleChange}
			/>
			<ul>
				{files.map((file) => (
					<li key={file.name}>{file.name}</li>
				))}
			</ul>
		</div>
	);
}
```

### A noter

- Le contenu du fichier n est pas accessible directement: il faut le lire
	via `FileReader`, `Blob` ou une bibliotheque (ex: PapaParse pour CSV).
- Si vous avez besoin d envoyer le fichier a une API, utilisez `FormData`.
