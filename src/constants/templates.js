export const LANGUAGE_TEMPLATES = {
    javascript: `// JavaScript template\nfunction main() {\n  console.log('Hello from JavaScript');\n}\n\nmain();\n`,
    python: `# Python template\ndef main():\n    print('Hello from Python')\n\nif __name__ == '__main__':\n    main()\n`,
    'text/x-java': `// Java template\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java");\n    }\n}\n`,
    'text/x-c++src': `// C++ template\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    cout << "Hello from C++" << endl;\n    return 0;\n}\n`,
    'text/plain': ``,
};
