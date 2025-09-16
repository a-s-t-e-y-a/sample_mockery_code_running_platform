# Sample Coding Frontend

This is a sample/test frontend for a code running platform, built as a demonstration project. **Note: This is not fully implemented and is intended for testing and development purposes only.**

## Features

- **Code Editor**: Basic code editing interface (partial implementation)
- **Code Execution**: Simulated code running functionality (mocked)
- **User Interface**: Modern UI components using shadcn/ui
- **Responsive Design**: Mobile-friendly layout

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/a-s-t-e-y-a/sample_mockery_code_running_platform.git
   cd sample_mockery_code_running_platform
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   # or
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- Navigate to the main page to access the code editor
- Write or paste your code in the editor
- Click "Run" to execute the code (currently simulated)
- View the output in the results panel

## Project Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── ui/          # shadcn/ui components
└── lib/
    └── utils.ts
```

## Contributing

This is a sample project for demonstration purposes. Contributions are welcome for educational purposes.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This frontend is a work-in-progress and does not represent a complete coding platform. It is intended for testing UI/UX concepts and basic functionality.
