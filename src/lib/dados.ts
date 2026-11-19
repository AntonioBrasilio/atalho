import { getCollection } from 'astro:content';
import { ordenarRecentes } from './util';

export async function respostasGta6() {
  return ordenarRecentes(await getCollection('respostas', (r) => r.data.jogo === 'gta6'));
}

export async function guias() {
  return getCollection('guias');
}
