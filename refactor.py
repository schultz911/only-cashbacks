import re

def main():
    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Add import for useUserData
    content = content.replace("import { KNOWN_MERCHANTS } from './data/merchants';",
                              "import { KNOWN_MERCHANTS } from './data/merchants';\nimport { useUserData } from './context/UserDataContext';")

    # Replace specific state definitions
    states_to_remove = [
        r"const \[exhaustedCards, setExhaustedCards\] = useState[^\n]+;\n",
        r"const \[cardBillDates, setCardBillDates\] = useState[^\n]+;\n",
        r"const \[paidBills, setPaidBills\] = useState[^\n]+;\n",
        r"const \[loungePassesUsed, setLoungePassesUsed\] = useState[^\n]+;\n",
        r"const \[loungeMilestonesVerified, setLoungeMilestonesVerified\] = useState[^\n]+;\n",
        r"const \[offerUsage, setOfferUsage\] = useState[^\n]+;\n",
        r"const \[openRouterApiKey, setOpenRouterApiKey\] = useState[^\n]+;\n",
        r"const \[kiwiNeonEarnRate, setKiwiNeonEarnRate\] = useState[^\n]+;\n",
        r"const \[walletCards, setWalletCards\] = useState[^\n]+;\n",
        r"const \[cashbackLogs, setCashbackLogs\] = useState[^\n]+;\n",
        r"const \[isSyncPaused, setIsSyncPaused\] = useState[^\n]+;\n",
        r"const \[user, setUser\] = useState<User \| null>\(null\);\n",
        r"const \[isAuthLoading, setIsAuthLoading\] = useState\(true\);\n",
        r"const \[isDataLoaded, setIsDataLoaded\] = useState\(false\);\n",
        r"const \[syncError, setSyncError\] = useState<string \| null>\(null\);\n",
        r"const \[isSyncing, setIsSyncing\] = useState\(false\);\n",
        r"const \[isDirty, setIsDirty\] = useState\(false\);\n",
        r"const isDirtyRef = useRef\(false\);\n",
        r"const pendingSyncCounterRef = useRef\(0\);\n",
        r"const latestStateRef = useRef[^\n]+\n[^\n]+\n[^\n]+\n",
        r"useEffect\(\(\) => \{\n    latestStateRef\.current =[^\n]+\n[^\n]+\n[^\n]+\n  \}, \[exhaustedCards, loungePassesUsed, loungeMilestonesVerified, offerUsage, cardBillDates, paidBills, openRouterApiKey, kiwiNeonEarnRate, walletCards, cashbackLogs, theme\]\);\n"
    ]
    
    for pattern in states_to_remove:
        content = re.sub(pattern, "", content, flags=re.MULTILINE)
        
    # Replace theme state (it's multiline)
    theme_pattern = r"const \[theme, setTheme\] = useState<'light' \| 'dark' \| 'oled'>\(\(\) => \{[\s\S]*?\}\);\n"
    content = re.sub(theme_pattern, "", content)

    # We need to insert the useUserData hook call right after 'export default function App() {'
    insert_idx = content.find('export default function App() {')
    insert_idx = content.find('{', insert_idx) + 1
    
    hook_code = """
  const { userData, updateUserData, user, isAuthLoading, isDataLoaded, isSyncing, syncError, isSyncPaused, setIsSyncPaused, saveData, handleDeleteData } = useUserData();
  const { exhaustedCards, cardBillDates, paidBills, loungePassesUsed, loungeMilestonesVerified, offerUsage, openRouterApiKey, kiwiNeonEarnRate, walletCards, cashbackLogs, theme } = userData;

  const setExhaustedCards = (val: any) => updateUserData({ exhaustedCards: typeof val === 'function' ? val(exhaustedCards) : val });
  const setCardBillDates = (val: any) => updateUserData({ cardBillDates: typeof val === 'function' ? val(cardBillDates) : val });
  const setPaidBills = (val: any) => updateUserData({ paidBills: typeof val === 'function' ? val(paidBills) : val });
  const setLoungePassesUsed = (val: any) => updateUserData({ loungePassesUsed: typeof val === 'function' ? val(loungePassesUsed) : val });
  const setLoungeMilestonesVerified = (val: any) => updateUserData({ loungeMilestonesVerified: typeof val === 'function' ? val(loungeMilestonesVerified) : val });
  const setOfferUsage = (val: any) => updateUserData({ offerUsage: typeof val === 'function' ? val(offerUsage) : val });
  const setOpenRouterApiKey = (val: any) => updateUserData({ openRouterApiKey: typeof val === 'function' ? val(openRouterApiKey) : val });
  const setKiwiNeonEarnRate = (val: any) => updateUserData({ kiwiNeonEarnRate: typeof val === 'function' ? val(kiwiNeonEarnRate) : val });
  const setWalletCards = (val: any) => updateUserData({ walletCards: typeof val === 'function' ? val(walletCards) : val });
  const setCashbackLogs = (val: any) => updateUserData({ cashbackLogs: typeof val === 'function' ? val(cashbackLogs) : val });
  const setTheme = (val: any) => updateUserData({ theme: typeof val === 'function' ? val(theme) : val });
  const isDirty = false; // Mock for now, handled by context
"""
    content = content[:insert_idx] + hook_code + content[insert_idx:]

    # Now remove the block of Firebase effects and local storage effects.
    # We will just remove from "useEffect(() => {\n    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {"
    # to the end of the `useEffect(() => markDirty(), [...]);` line.
    # Also the large localStorage save effect.
    
    start_str = "useEffect(() => {\n    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {"
    end_str = "  useEffect(() => {\n    // Save to localStorage regardless of user status"
    
    start_idx = content.find(start_str)
    
    # We'll also just find the end of the huge localStorage block
    end_ls_str = "  }, [exhaustedCards, loungePassesUsed, loungeMilestonesVerified, offerUsage, cardBillDates, paidBills, openRouterApiKey, kiwiNeonEarnRate, walletCards, cashbackLogs, theme, isDataLoaded]);"
    
    if start_idx != -1:
        end_idx = content.find(end_ls_str, start_idx) + len(end_ls_str)
        content = content[:start_idx] + content[end_idx:]
    else:
        print("Could not find start string for removing effects.")

    # Remove handleDeleteData and saveData as they are provided by context.
    # Wait, we provided handleDeleteData in context, but App.tsx has its own which sets local states like setHistory([]), setDeleteConfirmText(''), etc.
    # Actually, we should keep the UI states reset in App.tsx's handleDeleteData, or just rename the context one.
    # Let's rename the context one inside the hook destruction to _handleDeleteData
    content = content.replace("handleDeleteData } = useUserData();", "handleDeleteData: _handleDeleteData } = useUserData();")
    
    # In App.tsx's handleDeleteData, replace `await deleteDoc(docRef);` and local resets with `await _handleDeleteData();`
    handle_delete_replace = """
  const handleDeleteData = async () => {
    if (deleteConfirmText !== 'DELETE' || !user) return;
    try {
      await _handleDeleteData();
      setHistory([]);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      setIsProfileMenuOpen(false);
      showToast('All user data deleted permanently.', 'info');
    } catch (error: any) {
      alert('Failed to delete data. Please check your permissions.');
    }
  };
"""
    
    old_delete = re.search(r"const handleDeleteData = async \(\) => \{.*?\n  \};", content, re.DOTALL)
    if old_delete:
        content = content.replace(old_delete.group(0), handle_delete_replace.strip())

    # Remove saveData function from App.tsx since we get it from context
    old_save = re.search(r"const saveData = async \(\) => \{.*?\n  \};\n", content, re.DOTALL)
    if old_save:
        content = content.replace(old_save.group(0), "")

    # Also remove markDirty
    old_mark = re.search(r"const markDirty = \(\) => \{.*?\n  \};\n", content, re.DOTALL)
    if old_mark:
        content = content.replace(old_mark.group(0), "")

    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Refactoring done.")

if __name__ == '__main__':
    main()
