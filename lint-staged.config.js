export default {
  '*.{js,ts,tsx}': ['eslint --max-warnings=0', 'prettier --write'],
  '*.{ts,tsx}': () => 'tsc --noEmit',
  '*.{json,md}': ['prettier --write'],
}
