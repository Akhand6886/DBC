export interface EditorSettings {
  theme?: string;
  fontSize?: number;
  tabSize?: number;
  autoSave?: boolean;
}

export const defineMonacoThemes = (monaco: any) => {
  if (!monaco || !monaco.editor) return;

  monaco.editor.defineTheme('vscode-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editorLineNumber.foreground': '#858585',
    }
  });

  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715e' },
      { token: 'keyword', foreground: 'f92672' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'type', foreground: '66d9ef' },
      // ED-03: Comprehensive SQL token coverage
      { token: 'operator.sql', foreground: 'f92672' },
      { token: 'delimiter.sql', foreground: 'f8f8f2' },
      { token: 'type.sql', foreground: '66d9ef' },
      { token: 'predefined.sql', foreground: 'a6e22e' },
      { token: 'identifier.sql', foreground: 'fd971f' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
      'editorLineNumber.foreground': '#90908a',
    }
  });

  monaco.editor.defineTheme('onedark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c678dd' },
      { token: 'string', foreground: '98c379' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'type', foreground: 'e5c07b' },
      // ED-03: Comprehensive SQL token coverage
      { token: 'operator.sql', foreground: '56b6c2' },
      { token: 'delimiter.sql', foreground: 'abb2bf' },
      { token: 'type.sql', foreground: 'e5c07b' },
      { token: 'predefined.sql', foreground: '61afef' },
      { token: 'identifier.sql', foreground: 'e06c75' },
    ],
    colors: {
      'editor.background': '#282c34',
      'editor.foreground': '#abb2bf',
      'editorLineNumber.foreground': '#4b5263',
    }
  });

  monaco.editor.defineTheme('cyberpunk', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '00e5ff', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff007f' },
      { token: 'string', foreground: '00ff9f' },
      { token: 'number', foreground: 'ffe600' },
      { token: 'type', foreground: '00f0ff' },
      // ED-03: Comprehensive SQL token coverage
      { token: 'operator.sql', foreground: 'ff007f' },
      { token: 'delimiter.sql', foreground: '00f0ff' },
      { token: 'type.sql', foreground: 'ffe600' },
      { token: 'predefined.sql', foreground: '00ff9f' },
      { token: 'identifier.sql', foreground: 'ffffff' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#00f0ff',
      'editorLineNumber.foreground': '#30363d',
    }
  });
};

export const getMonacoThemeName = (theme?: string): string => {
  if (!theme) return 'vs-dark';
  if (['vscode-dark', 'monokai', 'onedark', 'cyberpunk'].includes(theme)) {
    return theme;
  }
  return 'vs-dark';
};
