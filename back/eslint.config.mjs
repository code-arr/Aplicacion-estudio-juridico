// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist'],
  },
  eslint.configs.recommended,
  // Cambiamos 'recommendedTypeChecked' por el 'recommended' simple (como en el front)
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
    },
    rules: {
      // Apagamos Prettier para que no pinte todo de amarillo/rojo por espacios
      'prettier/prettier': 'off',
      // Bajamos la intensidad de las variables no usadas
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
);

