# ADOMODS

<div align="center">


**A Dance of Fire and Ice 모드 브라우저**

ADOFAI 게임의 모드 목록을 확인하고 다운로드할 수 있는 웹사이트

[🌐 웹사이트 방문](https://adomods.kro.kr) • [📖 모드 설치 가이드](https://adof.ai/mod) • [💬 ADOFAI.gg 디스코드](https://discord.gg/adofaigg)

</div>

---

## 📋 목차

- [소개](#-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [설치 및 실행](#-설치-및-실행)
- [프로젝트 구조](#-프로젝트-구조)
- [기여하기](#-기여하기)
- [라이센스](#-라이센스)
- [면책 조항](#-면책-조항)

---

## 🎮 소개

ADOMODS는 **A Dance of Fire and Ice (ADOFAI)** 게임의 모드를 쉽게 찾고 다운로드할 수 있는 웹 플랫폼입니다. ADOFAI.gg의 모드 데이터를 활용하여 사용자 친화적인 인터페이스로 모드 정보를 제공합니다.

### ✨ 왜 ADOMODS인가요?

- 🔍 **쉬운 검색**: 모드 이름, 설명, 제작자로 빠른 검색
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기에서 최적화
- 🌙 **다크/라이트 테마**: 사용자 선호에 맞는 테마 선택
- 🌐 **다국어 지원**: 한국어, 영어 지원

---

## 🚀 주요 기능

### 🔍 모드 브라우징
- **실시간 검색**: 모드 이름, 설명, 제작자 검색
- **정렬 옵션**: 최신순, 이름순, 버전순 정렬
- **상세 정보**: 모드 설명, 업로드 날짜, 버전 정보

### 📱 사용자 경험
- **반응형 디자인**: 모든 기기에서 최적화된 경험
- **다크/라이트 테마**: 시스템 설정 자동 감지 또는 수동 선택
- **다국어 지원**: 한국어/영어 자동 감지 및 수동 변경

### 🔗 외부 연동
- **직접 다운로드**: GitHub 릴리스 페이지로 바로 연결
- **디스코드 연동**: 원본 디스코드 메시지로 이동
- **모드 설치 가이드**: 공식 설치 가이드 링크 제공

---

## 🛠 기술 스택

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

### 데이터 처리
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown)
- **Syntax Highlighting**: [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
- **Date Formatting**: [date-fns](https://date-fns.org/)

### 배포 및 호스팅
- **Platform**: [Vercel](https://vercel.com/)
- **Domain**: Custom domain with SSL
- **CDN**: Global edge network

---

## 🚀 설치 및 실행

### 필수 요구사항
- Node.js 18.0.0 이상
- pnpm (권장) 또는 npm

### 로컬 개발 환경 설정

1. **저장소 클론**
   ```bash
   git clone https://github.com/MAIJEUN/ADOMODS.git
   cd ADOMODS
   ```

2. **의존성 설치**
   ```bash
   pnpm install
   # 또는
   npm install
   ```

3. **개발 서버 실행**
   ```bash
   pnpm dev
   # 또는
   npm run dev
   ```

4. **브라우저에서 확인**
   ```
   http://localhost:3000
   ```

### 빌드 및 배포

```bash
# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start
```

---

## 📁 프로젝트 구조

```
ADOMODS/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── mod/[id]/          # 모드 상세 페이지
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈페이지
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── header.tsx        # 헤더 컴포넌트
│   ├── footer.tsx        # 푸터 컴포넌트
│   └── ...
├── lib/                  # 유틸리티 함수
│   ├── i18n.ts          # 다국어 지원
│   ├── storage.ts       # 로컬 스토리지 관리
│   └── mock-data.ts     # 모의 데이터
├── hooks/               # 커스텀 React 훅
├── public/              # 정적 파일
└── ...
```

---

## 🤝 기여하기

ADOMODS 프로젝트에 기여해주셔서 감사합니다! 

### 기여 방법

1. **이슈 확인**: [Issues](https://github.com/MAIJEUN/ADOMODS/issues)에서 기존 이슈를 확인하거나 새로운 이슈를 생성하세요.

2. **포크 및 브랜치 생성**:
   ```bash
   git fork https://github.com/MAIJEUN/ADOMODS.git
   git checkout -b feature/새로운-기능
   ```

3. **변경사항 커밋**:
   ```bash
   git commit -m "feat: 새로운 기능 추가"
   ```

4. **Pull Request 생성**: 변경사항에 대한 자세한 설명과 함께 PR을 생성해주세요.

### 개발 가이드라인

- **코드 스타일**: ESLint와 Prettier 설정을 따라주세요
- **커밋 메시지**: [Conventional Commits](https://www.conventionalcommits.org/) 형식을 사용해주세요
- **테스트**: 새로운 기능에 대한 테스트를 작성해주세요
- **문서화**: README나 코드 주석을 업데이트해주세요

---

## 📄 라이센스

이 프로젝트는 [GNU General Public License v3.0](LICENSE) 라이센스 하에 배포됩니다.

---

## ⚠️ 면책 조항

- **ADOMODS는 7th Beat Games에서 제작되거나 승인받지 않았습니다.**
- **ADOMODS는 ADOFAI.gg에서 제작되거나 승인받지 않았습니다.**
- 이 프로젝트는 ADOFAI 커뮤니티를 위한 비공식 도구입니다.
- 모든 모드 데이터는 ADOFAI.gg API를 통해 제공됩니다.

---

## 🔗 관련 링크

- [ADOFAI 공식 사이트](https://7beatgames.com/)
- [ADOFAI.gg](https://adofai.gg/)
- [모드 설치 가이드](https://adof.ai/mod)
- [ADOFAI.gg 디스코드](https://discord.gg/adofaigg)

---

<div align="center">

Made with ❤️ by [MAIJSOFT Dev](https://github.com/MAIJEUN)

</div>

---

# ADOMODS

<div align="center">


**A Dance of Fire and Ice Mod Browser**

A website to browse and download mods for the ADOFAI game

[🌐 Visit Website](https://adomods.vercel.app) • [📖 Mod Installation Guide](https://adof.ai/mod) • [💬 ADOFAI.gg Discord](https://discord.gg/adofaigg)

</div>

---

## 📋 Table of Contents

- [Introduction](#-introduction)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Installation & Setup](#-installation--setup)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)
- [Disclaimer](#-disclaimer)

---

## 🎮 Introduction

ADOMODS is a web platform that makes it easy to find and download mods for **A Dance of Fire and Ice (ADOFAI)**. It provides mod information through a user-friendly interface using mod data from ADOFAI.gg.

### ✨ Why ADOMODS?

- 🔍 **Easy Search**: Quick search by mod name, description, or creator
- 📱 **Responsive Design**: Optimized for mobile, tablet, and desktop
- 🌙 **Dark/Light Theme**: Choose your preferred theme
- 🌐 **Multi-language**: Korean and English support

---

## 🚀 Key Features

### 🔍 Mod Browsing
- **Real-time Search**: Search by mod name, description, creator
- **Sorting Options**: Sort by latest, name, version
- **Detailed Info**: Mod description, upload date, version info

### 📱 User Experience
- **Responsive Design**: Optimized experience on all devices
- **Dark/Light Theme**: Auto-detect system settings or manual selection
- **Multi-language**: Auto-detect Korean/English or manual change

### 🔗 External Integration
- **Direct Download**: Direct link to GitHub release pages
- **Discord Integration**: Navigate to original Discord messages
- **Installation Guide**: Link to official installation guide

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Data Processing
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown)
- **Syntax Highlighting**: [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
- **Date Formatting**: [date-fns](https://date-fns.org/)

### Deployment & Hosting
- **Platform**: [Vercel](https://vercel.com/)
- **Domain**: Custom domain with SSL
- **CDN**: Global edge network

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18.0.0 or higher
- pnpm (recommended) or npm

### Local Development Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/MAIJEUN/ADOMODS.git
   cd ADOMODS
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Run Development Server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. **Open in Browser**
   ```
   http://localhost:3000
   ```

### Build & Deploy

```bash
# Production build
pnpm build

# Run production server
pnpm start
```

---

## 📁 Project Structure

```
ADOMODS/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── mod/[id]/          # Mod detail pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── header.tsx        # Header component
│   ├── footer.tsx        # Footer component
│   └── ...
├── lib/                  # Utility functions
│   ├── i18n.ts          # Internationalization
│   ├── storage.ts       # Local storage management
│   └── mock-data.ts     # Mock data
├── hooks/               # Custom React hooks
├── public/              # Static files
└── ...
```

---

## 🤝 Contributing

Thank you for contributing to the ADOMODS project!

### How to Contribute

1. **Check Issues**: Check existing issues in [Issues](https://github.com/MAIJEUN/ADOMODS/issues) or create a new one.

2. **Fork & Create Branch**:
   ```bash
   git fork https://github.com/MAIJEUN/ADOMODS.git
   git checkout -b feature/new-feature
   ```

3. **Commit Changes**:
   ```bash
   git commit -m "feat: add new feature"
   ```

4. **Create Pull Request**: Create a PR with detailed description of your changes.

### Development Guidelines

- **Code Style**: Follow ESLint and Prettier configurations
- **Commit Messages**: Use [Conventional Commits](https://www.conventionalcommits.org/) format
- **Testing**: Write tests for new features
- **Documentation**: Update README or code comments

---

## 📄 License

This project is distributed under the [GNU General Public License v3.0](LICENSE).

---

## ⚠️ Disclaimer

- **ADOMODS is not made or endorsed by 7th Beat Games.**
- **ADOMODS is not made or endorsed by ADOFAI.gg.**
- This project is an unofficial tool for the ADOFAI community.
- All mod data is provided through the ADOFAI.gg API.

---

## 🔗 Related Links

- [ADOFAI Official Site](https://7beatgames.com/)
- [ADOFAI.gg](https://adofai.gg/)
- [Mod Installation Guide](https://adof.ai/mod)
- [ADOFAI.gg Discord](https://discord.gg/adofaigg)

---

<div align="center">

Made with ❤️ by [MAIJSOFT Dev](https://github.com/MAIJEUN)

</div>
