import { useState, useEffect, useCallback } from 'react';
import { AppData, PondRecord, TreeRecord, CattleRecord, LaborRecord, Transaction } from '../types';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch,
  getDocs
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We can show a toast or alert here if needed
}

const INITIAL_DATA: AppData = {
  ponds: [
    { id: '1', pondName: 'পুকুর ১', seedCount: 0, feedExpense: 0, sales: 0, growthNotes: 'শুরু হয়নি', lastUpdated: new Date().toISOString() },
    { id: '2', pondName: 'পুকুর ২', seedCount: 0, feedExpense: 0, sales: 0, growthNotes: 'শুরু হয়নি', lastUpdated: new Date().toISOString() },
    { id: '3', pondName: 'পুকুর ৩', seedCount: 0, feedExpense: 0, sales: 0, growthNotes: 'শুরু হয়নি', lastUpdated: new Date().toISOString() },
    { id: '4', pondName: 'পুকুর ৪', seedCount: 0, feedExpense: 0, sales: 0, growthNotes: 'শুরু হয়নি', lastUpdated: new Date().toISOString() },
  ],
  trees: [
    { id: '1', type: 'নারিকেল', count: 0, harvestCount: 0, income: 0, expense: 0, lastFertilized: '' },
    { id: '2', type: 'আম', count: 0, harvestCount: 0, income: 0, expense: 0, lastFertilized: '' },
  ],
  cattle: [],
  labor: [],
  transactions: [],
};

const STORAGE_KEY = 'farm_management_data_v2';

export function useFarmData() {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [user, setUser] = useState(auth.currentUser);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync auth state
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      // Don't set loading false here, let Firestore sync handle it
    });
    return unsub;
  }, []);

  // Fetch data from Firestore or LocalStorage
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse local storage", e);
        }
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    const paths = ['ponds', 'trees', 'cattle', 'labor', 'transactions'];
    const unsubscribes: (() => void)[] = [];
    
    // Track which collections have arrived
    const localReadyState: Record<string, boolean> = {};

    paths.forEach(path => {
      const colRef = collection(userDocRef, path);
      const q = path === 'transactions' ? query(colRef, orderBy('date', 'desc')) : colRef;
      
      const unsub = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        setData(prev => {
          if (JSON.stringify(prev[path as keyof AppData]) === JSON.stringify(items)) return prev;
          return { ...prev, [path]: items };
        });
        
        localReadyState[path] = true;
        // Check if all paths have reported at least once
        if (Object.keys(localReadyState).length === paths.length) {
          setLoading(false);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/${path}`);
        localReadyState[path] = true; 
        if (Object.keys(localReadyState).length === paths.length) {
          setLoading(false);
        }
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  // Save to LocalStorage ONLY if offline/logged out
  useEffect(() => {
    if (!user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, user]);

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const id = Date.now().toString();
    const newTransaction = { ...t, id };
    
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'transactions', id), newTransaction);
        showToast('লেনদেন সফলভাবে যোগ করা হয়েছে');
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/transactions/${id}`);
        showToast('লেনদেন যোগ করতে সমস্যা হয়েছে', 'error');
      }
    } else {
      setData(prev => ({ ...prev, transactions: [newTransaction, ...prev.transactions] }));
      showToast('লেনদেন সেভ করা হয়েছে (অফলাইন)');
    }
  };

  const updatePonds = async (newPonds: PondRecord[]) => {
    // Determine what changed to create transactions
    const transactionsToAdd: Transaction[] = [];
    const now = new Date().toISOString();

    newPonds.forEach(newPond => {
      const oldPond = data.ponds.find(p => p.id === newPond.id);
      if (oldPond) {
        // Feed Expense changed
        if (newPond.feedExpense > oldPond.feedExpense) {
          transactionsToAdd.push({
            id: `t-p-exp-${newPond.id}-${Date.now()}`,
            type: 'ব্যয়',
            category: 'পুকুর',
            subCategory: `${newPond.pondName} (খাদ্য)`,
            amount: newPond.feedExpense - oldPond.feedExpense,
            date: now
          });
        }
        // Sales changed
        if (newPond.sales > oldPond.sales) {
          transactionsToAdd.push({
            id: `t-p-sale-${newPond.id}-${Date.now()}`,
            type: 'আয়',
            category: 'পুকুর',
            subCategory: `${newPond.pondName} (বিক্রয়)`,
            amount: newPond.sales - oldPond.sales,
            date: now
          });
        }
      } else {
        // New pond added
        if (newPond.feedExpense > 0) {
          transactionsToAdd.push({
            id: `t-p-exp-${newPond.id}-${Date.now()}`,
            type: 'ব্যয়',
            category: 'পুকুর',
            subCategory: `${newPond.pondName} (প্রাথমিক খরচ)`,
            amount: newPond.feedExpense,
            date: now
          });
        }
        if (newPond.sales > 0) {
          transactionsToAdd.push({
            id: `t-p-sale-${newPond.id}-${Date.now()}`,
            type: 'আয়',
            category: 'পুকুর',
            subCategory: `${newPond.pondName} (প্রাথমিক বিক্রয়)`,
            amount: newPond.sales,
            date: now
          });
        }
      }
    });

    // Optimistic Update
    setData(prev => ({
      ...prev,
      ponds: newPonds,
      transactions: [...transactionsToAdd, ...prev.transactions]
    }));

    if (user) {
      try {
        const batch = writeBatch(db);
        newPonds.forEach(p => {
          batch.set(doc(db, 'users', user.uid, 'ponds', p.id), p);
        });
        transactionsToAdd.forEach(t => {
          batch.set(doc(db, 'users', user.uid, 'transactions', t.id), t);
        });
        await batch.commit();
        showToast('পুকুর ও লেনদেনের তথ্য সিঙ্ক হয়েছে');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/ponds_batch`);
        showToast('ডেটা সিঙ্ক ব্যর্থ হয়েছে', 'error');
        // Rollback technically better here, but snapshot will eventually fix it
      }
    } else {
      showToast('ডেটা সেভ করা হয়েছে (অফলাইন)');
    }
  };

  const updateTrees = async (newTrees: TreeRecord[]) => {
    // Determine what changed to create transactions
    const transactionsToAdd: Transaction[] = [];
    const now = new Date().toISOString();

    newTrees.forEach(newTree => {
      const oldTree = data.trees.find(t => t.id === newTree.id);
      const oldExpense = Number(oldTree?.expense) || 0;
      const oldIncome = Number(oldTree?.income) || 0;

      if (oldTree) {
        // Expense changed (e.g., fertilizer, meds)
        if (newTree.expense > oldExpense) {
          transactionsToAdd.push({
            id: `t-tr-exp-${newTree.id}-${Date.now()}`,
            type: 'ব্যয়',
            category: 'বাগান',
            subCategory: `${newTree.type} (খরচ)`,
            amount: Number(newTree.expense) - oldExpense,
            date: now
          });
        }
        // Income changed (harvest sales)
        if (Number(newTree.income) > oldIncome) {
          transactionsToAdd.push({
            id: `t-tr-inc-${newTree.id}-${Date.now()}`,
            type: 'আয়',
            category: 'বাগান',
            subCategory: `${newTree.type} (বিক্রয়)`,
            amount: Number(newTree.income) - oldIncome,
            date: now
          });
        }
      } else {
        // New tree record added with initial values
        if (Number(newTree.expense) > 0) {
          transactionsToAdd.push({
            id: `t-tr-exp-${newTree.id}-${Date.now()}`,
            type: 'ব্যয়',
            category: 'বাগান',
            subCategory: `${newTree.type} (প্রাথমিক খরচ)`,
            amount: Number(newTree.expense),
            date: now
          });
        }
        if (Number(newTree.income) > 0) {
          transactionsToAdd.push({
            id: `t-tr-inc-${newTree.id}-${Date.now()}`,
            type: 'আয়',
            category: 'বাগান',
            subCategory: `${newTree.type} (বিক্রয়)`,
            amount: Number(newTree.income),
            date: now
          });
        }
      }
    });

    // Optimistic Update
    setData(prev => ({
      ...prev,
      trees: newTrees,
      transactions: [...transactionsToAdd, ...prev.transactions]
    }));

    if (user) {
      try {
        const batch = writeBatch(db);
        newTrees.forEach(t => {
          batch.set(doc(db, 'users', user.uid, 'trees', t.id), t);
        });
        transactionsToAdd.forEach(tr => {
          batch.set(doc(db, 'users', user.uid, 'transactions', tr.id), tr);
        });
        await batch.commit();
        showToast('বাগান ও লেনদেনের তথ্য সিঙ্ক হয়েছে');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/trees_batch`);
        showToast('ডেটা সিঙ্ক ব্যর্থ হয়েছে', 'error');
      }
    } else {
      showToast('ডেটা সেভ করা হয়েছে (অফলাইন)');
    }
  };
  
  const addCattle = async (record: CattleRecord) => {
    const transactionId = `t-ct-${record.id}`;
    const now = new Date().toISOString();
    let newTransaction: Transaction | null = null;

    if (record.expense > 0) {
      newTransaction = {
        id: transactionId,
        type: 'ব্যয়',
        category: 'গরু',
        subCategory: record.tagId,
        amount: record.expense,
        date: now
      };
    }

    // Optimistic Update
    setData(prev => ({
      ...prev,
      cattle: [record, ...prev.cattle],
      transactions: newTransaction ? [newTransaction, ...prev.transactions] : prev.transactions
    }));

    if (user) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', user.uid, 'cattle', record.id), record);
        if (newTransaction) {
          batch.set(doc(db, 'users', user.uid, 'transactions', transactionId), newTransaction);
        }
        await batch.commit();
        showToast('গরুর রেকর্ড ও লেনদেন যোগ করা হয়েছে');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/cattle_batch`);
        showToast('রেকর্ড যোগ করতে সমস্যা হয়েছে', 'error');
        // Rollback
        setData(prev => ({
          ...prev,
          cattle: prev.cattle.filter(c => c.id !== record.id),
          transactions: newTransaction ? prev.transactions.filter(t => t.id !== transactionId) : prev.transactions
        }));
      }
    } else {
      showToast('রেকর্ড সেভ করা হয়েছে (অফলাইন)');
    }
  };
  
  const deleteCattle = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'cattle', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/cattle/${id}`);
      }
    } else {
      setData(prev => ({ ...prev, cattle: prev.cattle.filter(c => c.id !== id) }));
    }
  };
  
  const addLabor = async (record: LaborRecord) => {
    const transactionDate = record.date || new Date().toISOString();
    const transactionId = `t-lb-${record.id}`;
    
    const newTransaction: Transaction = { 
      id: transactionId,
      type: 'ব্যয়', 
      category: 'শ্রমিক', 
      subCategory: record.name, 
      amount: record.wage, 
      date: transactionDate 
    };

    // Optimistic Update: Bundled for consistency
    setData(prev => ({ 
      ...prev, 
      labor: [record, ...prev.labor],
      transactions: [newTransaction, ...prev.transactions]
    }));

    if (user) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', user.uid, 'labor', record.id), record);
        batch.set(doc(db, 'users', user.uid, 'transactions', transactionId), newTransaction);
        await batch.commit();
        showToast('শ্রমিক ও লেনদেন আপডেট হয়েছে');
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/labor_transaction`);
        showToast('সেভ করতে সমস্যা হয়েছে', 'error');
        // Rollback
        setData(prev => ({ 
          ...prev, 
          labor: prev.labor.filter(l => l.id !== record.id),
          transactions: prev.transactions.filter(t => t.id !== transactionId)
        }));
      }
    } else {
      showToast('সেভ করা হয়েছে (অফলাইন)');
    }
  };
  
  const deleteLabor = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'labor', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/labor/${id}`);
      }
    } else {
      setData(prev => ({ ...prev, labor: prev.labor.filter(l => l.id !== id) }));
    }
  };

  const resetData = async () => {
    if (confirm('আপনি কি সব ডেটা মুছে ফেলতে চান?')) {
      if (user) {
        // Warning: This is heavy. For a small app it's okay.
        const paths = ['ponds', 'trees', 'cattle', 'labor', 'transactions'];
        for (const path of paths) {
          const colRef = collection(db, 'users', user.uid, path);
          const snapshot = await getDocs(colRef);
          const batch = writeBatch(db);
          snapshot.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } else {
        setData(INITIAL_DATA);
      }
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `farm_data_backup_${new Date().toLocaleDateString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setData(json);
        alert('ডেটা সফলভাবে রিস্টোর করা হয়েছে!');
      } catch (err) {
        alert('ভুল ফাইল! দয়া করে সঠিক ব্যাকআপ ফাইল নির্বাচন করুন।');
      }
    };
    reader.readAsText(file);
  };

  const exportMonthlyCSV = (monthTransactions: Transaction[], monthName: string) => {
    const headers = ['Date', 'Type', 'Category', 'Sub-Category', 'Amount'];
    const rows = monthTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.category,
      t.subCategory || '-',
      t.amount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `farm_record_${monthName.replace(' ', '_')}.csv`);
    link.click();
  };

  return { data, loading, toast, updatePonds, updateTrees, addCattle, deleteCattle, addLabor, deleteLabor, resetData, exportData, importData, addTransaction, exportMonthlyCSV };
}
