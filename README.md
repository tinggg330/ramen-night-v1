# 深夜泡面 · 偷吃模式 V1

独立本地网页版本，基于当前本地 `ramen-night-v1`，包含其手机布局调整。普通模式与偷吃模式共用选择、制作、食物视觉和结局；没有修改或发布原站，也没有修改小红书版本。

## 本地运行

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 5178
```

访问 http://127.0.0.1:5178/，首页底部选择「偷吃模式」。主按钮「吃碗泡面」仍进入普通模式。

```sh
npm test
npm run lint
npm run build
```

`dist/` 为可部署产物。本次仅本地预览，未部署。

## 调整入口

- `src/survivalConfig.ts`：所有玩法数值、滑块速度／区域宽度、反馈时间和新音效路径。
- `src/survival.ts`：判定和胜负逻辑；失败优先，不按等待时间恢复警觉。
- `src/eatingSystem.ts`：共享的 0–10 进度映射，前 7 步吃面、后 3 步喝汤。
- `src/SurvivalScreen.tsx`：滑块、同步输入锁、警觉五态和失败重试。唯一进食状态由 App 持有；控制器的 ref 仅用于同一事件内同步结算，不是独立食物系统。
- `src/survival.css`：偷吃界面布局。只作用于新增界面；普通模式继续沿用原结构。

初始参数：Normal +1 / -12；Perfect +3 / +34；Miss +0 / +45；失败阈值 100；滑块单程 1800ms，安全区 40%，Perfect 6%。这些数值不在玩家说明中显示。警觉实际值可超过 100，显示条封顶。在指针／手指按下瞬间判定，松开不重复结算；键盘和辅助操作仍可激活。命中反馈期间丢弃输入，不排队；后台暂停滑块时间，返回前台保持原位置。

再试一次保留配方、重置整碗和警觉。偷吃成功后「再来一碗」保留偷吃模式，直接进入汤底选择并清空配菜。偷吃过程返回直接回首页；普通模式原有回退保留。

## 待补音效

`survivalConfig.audio.miss` 和 `.caught` 当前为 `null`，因此不会请求缺失文件，也不播放替代声音。收到用户录音后：

1. 放入 `public/assets/audio/survival/`。
2. 将配置改为 `/assets/audio/survival/miss.mp3`、`/assets/audio/survival/caught.mp3`。
3. 验证 Miss、失败、Miss 导致失败、快速返回／重试及静音；Miss 导致失败时，被发现音效延后 180ms。

Perfect 已接入用户提供的约 3 秒长嗦面：`public/assets/audio/slurp/slurp-long.mp3`。与原交互音效一样，新操作会停止上一个交互音效，不叠加；背景音乐与房间环境音保持独立循环。

## 视觉素材

`public/assets/watcher/` 包含五张 240×190 透明小猫 PNG 和四张独立符号 PNG。它们从用户确认的 `ramen-night-assets/reference/cat ref.png` 手工描边抠出，保留原图像素；惊醒姿势沿原图被子遮挡边界保留可见轮廓，不凭空重画被遮住的身体。素材较小，应按当前界面尺寸使用。

`public/assets/background/night-room-survival.png` 是原背景的独立图像编辑版本：仅去除床上固定熟睡小猫，防止与可变状态小猫重复。普通模式仍使用 `night-room-clean.png`。编辑使用内置图像工具，提示词见 `docs/background-edit-prompt.txt`。

## 验证

自动测试覆盖 13 组规则（包括按下命中、延迟松开不重复结算的输入回归测试）：全 Normal 成功、连续 Perfect 失败、Perfect 后 Miss、Miss 恢复、进度封顶、失败优先、警觉下限、五态边界、滑轨边界／往返、吃面喝汤映射和音频选择。

浏览器实测普通模式选择／制作／7 口面／3 口汤／Ending；偷吃模式制作／安全吃完／Perfect 失败／重试／整屏 Miss／快速输入／静音。尺寸检查包括 390×844 和 320×568。待补两段音效的实际播放不在本轮通过范围内。
