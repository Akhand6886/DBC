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
