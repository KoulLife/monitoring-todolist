# TODO List SPA

현대적이고 미려한 TODO List Single Page Application입니다. React + Vite + Tailwind CSS로 구현되었으며, TanStack Query를 사용한 서버 상태 관리와 옵티미스틱 업데이트를 지원합니다.

## 주요 기능

- ✅ 할 일 CRUD (생성, 조회, 수정, 삭제)
- 🌓 다크모드 지원 (로컬스토리지 저장)
- 🔍 실시간 검색
- 🎯 필터링 (전체/미완료/완료)
- 📊 정렬 (생성일/제목)
- ⚡ 옵티미스틱 업데이트
- 📱 반응형 디자인 (모바일 1열, 데스크톱 2열)
- ♿ 접근성 지원 (키보드 내비게이션, ARIA 레이블)
- 🎨 현대적인 UI (카드형 레이아웃, 애니메이션)

## 기술 스택

- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **TanStack Query (React Query)** - 서버 상태 관리
- **Axios** - HTTP 클라이언트
- **lucide-react** - 아이콘

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` (또는 Vite가 할당한 포트)로 접속하세요.

### 4. 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 5. 프로덕션 미리보기

```bash
npm run preview
```

## 프로젝트 구조

```
src/
├── api/
│   ├── client.js       # Axios 인스턴스 및 인터셉터
│   └── todos.js        # Todo API 함수
├── components/
│   ├── ConfirmDialog.jsx
│   ├── EmptyState.jsx
│   ├── ErrorState.jsx
│   ├── Skeleton.jsx
│   ├── ThemeToggle.jsx
│   ├── TodoForm.jsx
│   ├── TodoItem.jsx
│   └── Toolbar.jsx
├── hooks/
│   └── useTodos.js     # React Query 훅
├── lib/
│   └── utils.js        # 유틸리티 함수
├── pages/
│   └── TodoPage.jsx    # 메인 페이지
├── styles/
│   └── globals.css     # Tailwind CSS
├── App.jsx
└── main.jsx
```

## 사용 방법

### 할 일 추가
1. 상단 입력 필드에 할 일을 입력합니다.
2. "추가" 버튼을 클릭하거나 Enter 키를 누릅니다.

### 할 일 수정
1. 할 일 항목의 편집 아이콘을 클릭합니다.
2. 제목을 수정하고 Enter 키로 저장하거나 Esc 키로 취소합니다.

### 할 일 완료/미완료 토글
- 체크박스를 클릭하여 완료 상태를 변경합니다.

### 할 일 삭제
1. 삭제 아이콘을 클릭합니다.
2. 확인 다이얼로그에서 확인을 클릭합니다.

### 검색 및 필터
- 검색: 상단 검색창에 키워드를 입력합니다.
- 필터: 툴바의 필터 버튼을 클릭하여 상태별 필터를 선택합니다.
- 정렬: 필터 패널에서 정렬 기준을 선택합니다.

### 일괄 작업
- 전체 선택/해제: 필터 패널에서 버튼을 클릭합니다.
- 완료 항목 일괄 삭제: 필터 패널의 "완료 항목 삭제" 버튼을 클릭합니다.

### 다크모드
- 헤더 우측의 다크모드 토글 버튼을 클릭하여 전환합니다.
- 설정은 로컬스토리지에 저장되어 다음 방문 시에도 유지됩니다.

## API 연동

이 애플리케이션은 다음 API 엔드포인트를 사용합니다:

- `GET /api/todos` - 모든 할 일 조회
- `POST /api/todos` - 할 일 생성
- `PUT /api/todos/{id}` - 할 일 수정
- `DELETE /api/todos/{id}` - 할 일 삭제

자세한 API 문서는 `docs/api.md`를 참조하세요.

## 코드 품질

### ESLint

```bash
npm run lint
```

### Prettier

```bash
npm run format
```

## 테스트 체크리스트

### 기본 기능
- [ ] 할 일 추가 (제목 입력 후 추가 버튼 클릭)
- [ ] 할 일 완료/미완료 토글 (체크박스 클릭)
- [ ] 할 일 제목 수정 (편집 아이콘 클릭 후 수정)
- [ ] 할 일 삭제 (삭제 아이콘 클릭 후 확인)
- [ ] 완료 항목 일괄 삭제

### 검색 및 필터
- [ ] 검색어 입력 시 실시간 필터링
- [ ] 상태 필터 (전체/미완료/완료) 동작 확인
- [ ] 정렬 (생성일/제목, 오름차순/내림차순) 동작 확인
- [ ] URL 쿼리 파라미터 동기화 (새로고침 시 유지)

### UI/UX
- [ ] 다크모드 토글 동작 및 로컬스토리지 저장
- [ ] 반응형 레이아웃 (모바일 1열, 데스크톱 2열)
- [ ] 로딩 상태 (스켈레톤 UI)
- [ ] 빈 상태 (할 일이 없을 때)
- [ ] 에러 상태 (API 오류 시)
- [ ] 옵티미스틱 업데이트 (즉시 UI 반영)

### 접근성
- [ ] 키보드 내비게이션 (Tab, Enter, Esc, Arrow 키)
- [ ] 포커스 링 표시
- [ ] ARIA 레이블 적용
- [ ] 스크린 리더 호환성

### 에러 처리
- [ ] 네트워크 오류 시 에러 메시지 표시
- [ ] 404 오류 처리
- [ ] 재시도 기능

## 라이선스

MIT
