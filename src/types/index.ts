// Required
export interface VueGitalkCustom {
  /**
   * GitHub Application Client ID
   * @requires
   */
  clientID: string;

  /**
   * GitHub Application Client Secret.
   * @requires
   */
  clientSecret: string;

  /**
   * GitHub repository.
   * @requires
   */
  repo: string;

  /**
   * GitHub repository 所有者，可以是個人或者組織。
   * @requires
   */
  owner: string;

  /**
   * GitHub repository 的所有者和合作者 (對這個 repository 有寫權限的用戶)
   * @requires
   */
  admin: string[];
}

export interface VueGitalkOptions extends VueGitalkCustom {
  /**
   * 頁面的唯一標識。長度必須小於50。
   * @default location.href
   */
  id?: string;

  /**
   * 頁面的 issue ID，若未定義number屬性則會使用id進行定位
   * @default -1
   */
  number?: number;

  /**
   * GitHub issue 的標籤
   * @default ['Gitalk']
   */
  labels?: string[];

  /**
   * GitHub issue 的標題。
   * @default document.title
   */
  title?: string;

  /**
   * GitHub issue 的內容。
   * @default location.href + header.meta[description]
   */
  body?: string;

  /**
   * 每次載入的頁數
   * @default 10
   */
  perPage?: number;

  /**
   * 排序方式
   * 評論排序方式，
   * - last 為按評論創建時間倒敘
   * - first 為按創建時間正序
   *
   * @default 'last'
   */
  pagerDirection?: 'last' | 'first';

  /**
   * 如果當前頁面沒有相應的 isssue 且登錄的用戶屬於 admin，則會自動創建 issue。如果設置為 true，則顯示一個初始化頁面，創建 issue 需要點擊 init 按鈕。
   * @default false
   */
  createIssueManually?: boolean;

  /**
   * 類似Facebook評論框的全屏遮罩效果
   * @default false
   */
  distractionFreeMode?: boolean;

  /**
   * GitHub oauth 請求到反向代理，為了支援 CORS。
   * @default 'https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token
   */
  proxy?: string;

  /**
   * 啟用快捷鍵(cmd | ctrl + enter) 提交評論
   * @default true
   */
  enableHotKey?: boolean;

}
