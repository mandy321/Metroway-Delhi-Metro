const fs = require('fs');
const path = '/Users/mandeep/Documents/Metroway- Delhi Metro App, Map/mobile/src/app/index.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add PanResponder import
if (!content.includes('PanResponder')) {
  content = content.replace('Animated,', 'Animated,\n  PanResponder,');
}

// 2. Add Animated logic inside PlannerScreen
const animLogic = `
  const bottomSheetPanY = React.useRef(new Animated.Value(0)).current;
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.vy) > Math.abs(gestureState.vx);
      },
      onPanResponderGrant: () => {
        bottomSheetPanY.setOffset((bottomSheetPanY)._value || 0);
        bottomSheetPanY.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [null, { dy: bottomSheetPanY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        bottomSheetPanY.flattenOffset();
        const currentY = (bottomSheetPanY)._value || 0;
        const velocityY = gestureState.vy;

        if (velocityY < -0.5 || currentY < -100) {
          // Snap UP
          Animated.spring(bottomSheetPanY, {
            toValue: -300,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
        } else {
          // Snap DOWN
          Animated.spring(bottomSheetPanY, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
        }
      },
    })
  ).current;
`;

if (!content.includes('bottomSheetPanY')) {
  content = content.replace('const [activeTab, setActiveTab] = useState("timeline");', animLogic + '\n  const [activeTab, setActiveTab] = useState("timeline");');
}

// 3. Wrap Tabs in Animated.View and Drag Handle
const tabsStart = '{/* Tab Headers */}';
const newTabsStart = `
          {/* Draggable Bottom Sheet */}
          <Animated.View 
            style={[
              { flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: "#000", shadowOffset: {width: 0, height: -4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8, marginTop: 10 },
              { transform: [{ translateY: bottomSheetPanY }] }
            ]}
          >
            <View 
              {...panResponder.panHandlers} 
              style={{ width: '100%', alignItems: 'center', paddingVertical: 12, backgroundColor: activeTheme === 'dark' ? '#1c1c1e' : '#e3e3e8', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
            >
              <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: activeTheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }} />
            </View>
          {/* Tab Headers */}
`;
content = content.replace(tabsStart, newTabsStart);

const scrollEnd = '</ScrollView>\n          </View>';
const newScrollEnd = '</ScrollView>\n          </Animated.View>\n          </View>';
content = content.replace(scrollEnd, newScrollEnd);

fs.writeFileSync(path, content);
console.log("Patched index.tsx");
