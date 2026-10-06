import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Caminhos fixos, relativos a este script, independentemente do diretório do terminal.
const raiz = new URL('../', import.meta.url);
const destino = new URL('dist/', raiz);

await rm(destino, { recursive: true, force: true });
await mkdir(destino, { recursive: true });

// Publicar apenas arquivos usados pelo navegador; backups, docs e ferramentas ficam fora.
for (const caminho of ['index.html', 'css', 'js', 'imagens']) {
  await cp(new URL(caminho, raiz), new URL(caminho, destino), { recursive: true });
}

console.log(`Site preparado em ${fileURLToPath(destino)}`);
