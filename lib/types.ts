export interface NewsItem {
  date: string;
  tag: string;
  title: string;
  url?: string;
}

export interface BlogPost {
  date: string;
  title: string;
  excerpt: string;
  url: string;
  thumbnail?: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
}

export interface Newsletter {
  id: string;
  vol: string;
  issue: string;
  title: string;
  gradient: string;
  coverImage: string;
  pages: string[];
}

export interface EventItem {
  title: string;
  url: string;
  date?: string;
}

export interface MemberSession {
  memberNumber: string;
  loggedIn: boolean;
}

// 会員データ（振込管理付き）
export interface Member {
  memberNumber: string;
  name: string;
  email?: string;
  password: string;
  isActive: boolean;
  joinDate: string;           // YYYY-MM-DD
  lastPaymentDate: string | null;  // YYYY-MM-DD
  nextPaymentDate: string | null;  // YYYY-MM-DD
  notes?: string;
  createdAt: string;          // ISO timestamp
  updatedAt: string;          // ISO timestamp
}

// KV/JSONストアの構造
export type MembersRecord = Record<string, Member>;

// バックアップエントリのメタ情報
export interface BackupEntry {
  id: string;           // タイムスタンプ文字列（キー）
  timestamp: string;    // ISO timestamp
  memberCount: number;
  label?: string;
}
