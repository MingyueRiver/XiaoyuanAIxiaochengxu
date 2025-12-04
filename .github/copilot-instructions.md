# XiaoyuanAI Mini Program - Copilot Instructions

## Project Overview
This is a **WeChat Mini Program (小程序)** called "校园AI资源共享平台" (Campus AI Resource Sharing Platform) built with native WeChat APIs. It's a three-sided marketplace connecting students for:
- **Venues**: Finding and booking campus study/activity spaces
- **Tasks**: Posting and accepting campus services/errands (with rewards)
- **Resources**: Sharing educational materials (notes, videos, documents)

## Architecture & Key Patterns

### App-Level Setup (`app.js`)
- **Global request handler**: `app.request()` supports both real backend calls and mock data
- **Mock mode toggle**: `globalData.useMock: true` switches between development (mock) and production
- **User session**: `globalData.userInfo` persists across pages; restored from `wx.getStorageSync('userInfo')`
- **Mock responses**: Includes test credentials (`test`/`test`) and realistic response structures
- **API endpoint**: Currently points to `https://api.example.com` - must be configured in project settings

### Page Architecture
Pages follow the standard WeChat pattern (each in its own folder with `.js`, `.json`, `.wxml`, `.wxss`):
- **app.json**: Defines page routes, tab navigation, navigation bar styling (primary color: `#6366F1`)
- **Tab pages**: Index, category, resource-center, profile (linked in `app.json` `tabBar.list`)
- **Stack pages**: Login, register, resource-detail

### Styling & UI Conventions (`app.wxss`)
- **Design tokens**: Primary purple `#6366F1`, secondary `#8B5CF6`, neutral grays `#334155`, `#94A3B8`
- **Component classes**: `.common-button`, `.common-input`, `.common-card` with gradient effects
- **Units**: RPX (responsive pixels) used exclusively; example: `padding: 24rpx`, `border-radius: 20rpx`
- **Interactions**: Active states use `transform: translateY()` for press feedback, `:focus` states add `box-shadow` highlights

### Data Handling Pattern
- **Fetch on load**: Pages call methods in `onLoad()` and `onShow()` to fetch initial data
- **Mock fallback**: Failed API calls fall back to `getMockRecommendations()` (see `index.js`)
- **Auth checking**: Pages verify `app.globalData.userInfo` before allowing actions; unauthenticated users redirected to login
- **Navigation**: Use `wx.navigateTo()` for stack pages, `wx.switchTab()` for tab pages; wrap in `.catch()` for missing pages

### Form & Input Patterns (Login/Register)
- Inputs bound to `data` fields via `onInput*` event handlers
- Validation before request (non-empty checks)
- Token & user data stored via `wx.setStorageSync()` and `app.globalData.userInfo`
- Response structure: `{ success: boolean, code: number, data: {...}, message?: string }`

## Development Workflows

### Local Development & Testing
1. **Start**: Open WeChat Developer Tools, import `xiaochengxv/` folder
2. **Mock data**: `app.globalData.useMock = true` activates mock responses in `app.request()`
3. **Debugging**: Use DevTools console; check `console.log()` statements prefixed with `【标签】`
4. **Test credentials**: Username `test`, password `test` in mock mode

### Common Tasks
- **Adding a page**: Create folder in `pages/`, add `.js/.json/.wxml/.wxss`, register in `app.json`
- **API integration**: Use `app.request({ url, method, data })` - it handles headers & error formatting
- **Styling**: Extend `.common-*` classes in `app.wxss` or create page-specific `.wxss` files
- **Images**: Place in `images/` with subfolder like `images/tabbar/`; use `.png` format

## Code Examples & Conventions

### Making API Requests
```javascript
// Typical pattern from index.js
try {
  const res = await app.request({
    url: '/ai/recommendations',
    data: { type: this.data.activeTag, limit: 6 }
  });
  // Response expected: { success: true, code: 200, data: {...} }
  this.setData({ recommendations: res.data || [] });
} catch (error) {
  // Fallback to mock
  this.setData({ recommendations: this.getMockRecommendations() });
}
```

### Conditional Navigation with Error Handling
```javascript
// Pattern from index.js for pages in development
wx.navigateTo({
  url: '/pages/detail/detail?id=' + id
}).catch(() => {
  wx.showToast({ title: 'Feature in development', icon: 'none' });
});
```

### Auth Check Pattern
```javascript
checkAuth() {
  if (!app.globalData.userInfo) {
    wx.showModal({
      title: '未登录', content: '需要登录后才能操作',
      confirmText: '前往登录',
      success: (res) => { if (res.confirm) wx.navigateTo({ url: '/pages/login/login' }); }
    });
    return false;
  }
  return true;
}
```

## Critical Implementation Notes
- **No backend database**: Project uses mock data; production requires backend API configuration in `app.globalData.baseURL`
- **WeChat APIs**: Requires `scope.userInfo`, `scope.userLocation` permissions in `app.json` for real features
- **Images**: Default image paths (e.g., `/images/article-default.png`) may not exist—check before rendering
- **Tab switching**: Use `wx.switchTab()` for tab pages; use `currentTab` state to maintain active indicator
- **Pull-to-refresh**: Enabled in `app.json` `window.enablePullDownRefresh`; call `wx.stopPullDownRefresh()` after loading

## File Structure Essentials
```
xiaochengxv/
  app.js (global config, request handler, mock data)
  app.json (routes, tabBar, window styling)
  app.wxss (global styles: color scheme, buttons, inputs, cards)
  pages/
    login/ (authentication)
    register/ (user creation)
    index/ (home with AI recommendations)
    category/ (browse resources by category)
    profile/ (user account page)
    resource-center/ (resource hub)
    resource-detail/ (resource viewer)
  images/ (tabbar icons, defaults)
```

## Quick Debugging Checklist
- [ ] `useMock` setting matches intended environment
- [ ] Page registered in `app.json` routes
- [ ] `baseURL` configured for production backend
- [ ] Images exist in `images/` or fallback placeholders loaded
- [ ] API response format matches expected structure (`{ success, code, data, message }`)
- [ ] Tab pages use `wx.switchTab()`, stack pages use `wx.navigateTo()`
