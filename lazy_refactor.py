import re

def main():
    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Make sure Suspense is imported
    if 'Suspense' not in content:
        content = content.replace("import { useState, useEffect, useRef, useMemo } from 'react';",
                                  "import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';")

    # Replace import statements for Modals with React.lazy
    content = content.replace("import { LoungeTrackerModal, parseLoungeBenefit } from './components/LoungeTrackerModal';",
                              "import { parseLoungeBenefit } from './components/LoungeTrackerModal';\nconst LoungeTrackerModal = lazy(() => import('./components/LoungeTrackerModal').then(module => ({ default: module.LoungeTrackerModal })));")

    content = content.replace("import { WalletManagerModal } from './components/WalletManagerModal';",
                              "const WalletManagerModal = lazy(() => import('./components/WalletManagerModal').then(module => ({ default: module.WalletManagerModal })));")

    content = content.replace("import { DashboardModal } from './components/DashboardModal';",
                              "const DashboardModal = lazy(() => import('./components/DashboardModal').then(module => ({ default: module.DashboardModal })));")

    # Wrap modal usages in Suspense
    # Look for <LoungeTrackerModal, <WalletManagerModal, <DashboardModal
    # Actually, they are already rendered. Wrapping them individually in Suspense.
    # The safest way is to replace the tags.
    
    content = content.replace("<LoungeTrackerModal", "<Suspense fallback={null}><LoungeTrackerModal")
    content = content.replace('      />\n      <WalletManagerModal', '      /></Suspense>\n      <Suspense fallback={null}><WalletManagerModal')
    content = content.replace('      />\n      <DashboardModal', '      /></Suspense>\n      <Suspense fallback={null}><DashboardModal')
    # Since LoungeTrackerModal is the first, WalletManagerModal is second, DashboardModal is third.
    # Wait, let's just use regex to wrap them.
    
    def wrap_with_suspense(tag_name):
        nonlocal content
        pattern = r"(<" + tag_name + r"[\s\S]*?/>)"
        content = re.sub(pattern, r"<Suspense fallback={null}>\n        \1\n      </Suspense>", content)

    # Undo the replace hacks above if they didn't run, and run regex
    content = content.replace("<Suspense fallback={null}><LoungeTrackerModal", "<LoungeTrackerModal")
    content = content.replace('      /></Suspense>\n      <Suspense fallback={null}><WalletManagerModal', '      />\n      <WalletManagerModal')
    content = content.replace('      /></Suspense>\n      <Suspense fallback={null}><DashboardModal', '      />\n      <DashboardModal')

    wrap_with_suspense("LoungeTrackerModal")
    wrap_with_suspense("WalletManagerModal")
    wrap_with_suspense("DashboardModal")

    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Added lazy loading to App.tsx")

if __name__ == '__main__':
    main()
