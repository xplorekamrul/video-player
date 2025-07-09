const UserManual = ()=>{
   return <main>
       <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Playback Controls</h3>
              <div>✅ Play/Pause (Space, K)</div>
              <div>✅ Seek bar with preview</div>
              <div>✅ Volume slider control</div>
              <div>✅ Brightness adjustment</div>
              <div>✅ Speed control (0.25x-2x)</div>
              <div>✅ Quality switcher</div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Advanced Features</h3>
              <div>✅ Picture-in-Picture</div>
              <div>✅ Theater mode</div>
              <div>✅ Fullscreen mode</div>
              <div>✅ Resume playback</div>
              <div>✅ Mobile gestures</div>
              <div>✅ Keyboard shortcuts</div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Accessibility</h3>
              <div>✅ ARIA labels</div>
              <div>✅ Keyboard navigation</div>
              <div>✅ Screen reader support</div>
              <div>✅ Focus management</div>
              <div>✅ High contrast support</div>
              <div>✅ Local file playback</div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Controls & Shortcuts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <h4 className="font-medium">Keyboard Shortcuts</h4>
                <div>
                  <kbd className="px-1 py-0.5 bg-background rounded">Space</kbd> Play/Pause
                </div>
                <div>
                  <kbd className="px-1 py-0.5 bg-background rounded">←/→</kbd> Seek ±10s
                </div>
                <div>
                  <kbd className="px-1 py-0.5 bg-background rounded">↑/↓</kbd> Volume ±5%
                </div>
                <div>
                  <kbd className="px-1 py-0.5 bg-background rounded">F</kbd> Fullscreen
                </div>
                <div>
                  <kbd className="px-1 py-0.5 bg-background rounded">M</kbd> Mute
                </div>
                <div>
                  <kbd className="px-1 py-0.5 bg-background rounded">T</kbd> Theater
                </div>
                <div>
                  <kbd className="px-1 py-0.5 bg-background rounded">P</kbd> PiP
                </div>
                <div>
                  <kbd className="px-1 py-0.5 bg-background rounded">0-9</kbd> Seek %
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">Fullscreen Experience</h4>
                <div>
                  <strong>Cursor Control:</strong> 20s auto-hide
                </div>
                <div>
                  <strong>Progress Bar:</strong> Always visible with controls
                </div>
                <div>
                  <strong>Double-click Left:</strong> Rewind 10s
                </div>
                <div>
                  <strong>Double-click Right:</strong> Fast-forward 10s
                </div>
                <div>
                  <strong>Single Click:</strong> Play/Pause
                </div>
                <div>
                  <strong>Mobile Gestures:</strong> Tap, Swipe
                </div>
                <div>
                  <strong>Settings Menu:</strong> Available in fullscreen
                </div>
                <div>
                  <strong>All Controls:</strong> Fully accessible
                </div>
              </div>
            </div>
          </div>
   </main>
}

export default UserManual