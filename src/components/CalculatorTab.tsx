import React, { useState } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Users,
  Coins,
  ArrowRight,
  TrendingUp,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { ExpenseItem, SettlementDetail } from '../types';

interface CalculatorTabProps {
  exchangeRate: number;
  onUpdateExchangeRate: (rate: number) => void;
  expenses: ExpenseItem[];
  onUpdateExpenses: (expenses: ExpenseItem[]) => void;
  members: string[];
  onUpdateMembers: (members: string[]) => void;
  onShowToast: (msg: string) => void;
}

export const CalculatorTab: React.FC<CalculatorTabProps> = ({
  exchangeRate,
  onUpdateExchangeRate,
  expenses,
  onUpdateExpenses,
  members,
  onUpdateMembers,
  onShowToast,
}) => {
  const [cnyInput, setCnyInput] = useState<string>('100');
  const [krwInput, setKrwInput] = useState<string>(String(100 * exchangeRate));

  const [newMemberName, setNewMemberName] = useState<string>('');

  // Add expense form state
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmountCny, setExpenseAmountCny] = useState<string>('');
  const [payerChoice, setExpensePayer] = useState<string>(members[0] || '');
  // Members can change remotely (shared room), so fall back to the first member.
  const expensePayer = members.includes(payerChoice) ? payerChoice : members[0] || '';
  const [expenseCategory, setExpenseCategory] = useState<ExpenseItem['category']>('식사/맥주');
  const [splitChoice, setSelectedSplitMembers] = useState<string[]>(members);
  const selectedSplitMembers = splitChoice.filter((m) => members.includes(m));

  // Currency converter handlers
  const handleCnyChange = (val: string) => {
    setCnyInput(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setKrwInput(String(Math.round(num * exchangeRate)));
    } else {
      setKrwInput('');
    }
  };

  const handleKrwChange = (val: string) => {
    setKrwInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && exchangeRate > 0) {
      setCnyInput((num / exchangeRate).toFixed(1));
    } else {
      setCnyInput('');
    }
  };

  const handleRateAdjust = (delta: number) => {
    const newRate = Math.max(100, Math.min(300, exchangeRate + delta));
    onUpdateExchangeRate(newRate);
    const num = parseFloat(cnyInput);
    if (!isNaN(num)) {
      setKrwInput(String(Math.round(num * newRate)));
    }
  };

  // Member Management
  const handleAddMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    if (members.includes(trimmed)) {
      onShowToast('이미 존재하는 멤버 이름입니다.');
      return;
    }
    const updated = [...members, trimmed];
    onUpdateMembers(updated);
    setSelectedSplitMembers(updated);
    setNewMemberName('');
    onShowToast(`멤버 "${trimmed}"이(가) 추가되었습니다.`);
  };

  const handleRemoveMember = (name: string) => {
    if (members.length <= 1) {
      onShowToast('최소 1명 이상의 멤버가 필요합니다.');
      return;
    }
    const updated = members.filter((m) => m !== name);
    onUpdateMembers(updated);
    setSelectedSplitMembers((prev) => prev.filter((m) => m !== name));
    if (expensePayer === name) setExpensePayer(updated[0]);
  };

  // Add Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmountCny);
    if (!expenseTitle.trim()) {
      onShowToast('지출 내역 항목명을 입력해주세요.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      onShowToast('올바른 금액(¥)을 입력해주세요.');
      return;
    }
    if (selectedSplitMembers.length === 0) {
      onShowToast('함께 분담할 멤버를 최소 1명 선택해주세요.');
      return;
    }

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      title: expenseTitle.trim(),
      amountCny: amount,
      payer: expensePayer,
      splitMembers: [...selectedSplitMembers],
      category: expenseCategory,
      date: '여행 중',
    };

    onUpdateExpenses([newExpense, ...expenses]);
    setExpenseTitle('');
    setExpenseAmountCny('');
    onShowToast(`"${newExpense.title}" 지출 내역이 등록되었습니다.`);
  };

  const handleDeleteExpense = (id: string) => {
    onUpdateExpenses(expenses.filter((e) => e.id !== id));
    onShowToast('지출 내역이 삭제되었습니다.');
  };

  // Settlement algorithm: calculates net balances and optimal transfers
  const calculateSettlement = (): SettlementDetail[] => {
    // Net balance in CNY for each member: positive = owed money, negative = owes money
    const balances: { [member: string]: number } = {};
    members.forEach((m) => (balances[m] = 0));

    expenses.forEach((item) => {
      const payer = item.payer;
      const splitters = item.splitMembers.filter((m) => members.includes(m));
      if (splitters.length === 0) return;

      const perPerson = item.amountCny / splitters.length;

      // Payer paid the total
      balances[payer] = (balances[payer] || 0) + item.amountCny;

      // Each participant owes their share
      splitters.forEach((member) => {
        balances[member] = (balances[member] || 0) - perPerson;
      });
    });

    const debtors: { member: string; amount: number }[] = [];
    const creditors: { member: string; amount: number }[] = [];

    Object.entries(balances).forEach(([member, balance]) => {
      if (balance < -0.01) {
        debtors.push({ member, amount: -balance });
      } else if (balance > 0.01) {
        creditors.push({ member, amount: balance });
      }
    });

    const transfers: SettlementDetail[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const amountToTransfer = Math.min(debtor.amount, creditor.amount);

      transfers.push({
        from: debtor.member,
        to: creditor.member,
        amountCny: Number(amountToTransfer.toFixed(1)),
        amountKrw: Math.round(amountToTransfer * exchangeRate),
      });

      debtor.amount -= amountToTransfer;
      creditor.amount -= amountToTransfer;

      if (debtor.amount < 0.01) dIdx++;
      if (creditor.amount < 0.01) cIdx++;
    }

    return transfers;
  };

  const totalSpentCny = expenses.reduce((acc, curr) => acc + curr.amountCny, 0);
  const totalSpentKrw = Math.round(totalSpentCny * exchangeRate);
  const settlements = calculateSettlement();

  return (
    <div className="space-y-4">
      {/* 1. Real-time Currency Converter */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3.5 shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>실시간 위안화(CNY) ↔ 원화(KRW) 계산기</span>
          </h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleRateAdjust(-5)}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono"
            >
              -5
            </button>
            <button
              onClick={() => handleRateAdjust(-1)}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono"
            >
              -1
            </button>
            <span className="text-xs font-mono font-bold text-cyan-400 px-1">
              1元 = {exchangeRate}원
            </span>
            <button
              onClick={() => handleRateAdjust(+1)}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono"
            >
              +1
            </button>
            <button
              onClick={() => handleRateAdjust(+5)}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono"
            >
              +5
            </button>
          </div>
        </div>

        {/* Two-way Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold block">중국 위안 (CNY ¥)</label>
            <div className="flex items-center">
              <span className="text-amber-400 font-bold mr-1">¥</span>
              <input
                type="number"
                value={cnyInput}
                onChange={(e) => handleCnyChange(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-lg font-black text-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold block">한국 원화 (KRW ₩)</label>
            <div className="flex items-center">
              <span className="text-cyan-400 font-bold mr-1">₩</span>
              <input
                type="number"
                value={krwInput}
                onChange={(e) => handleKrwChange(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-lg font-black text-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick Reference Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          {[10, 20, 50, 100, 200, 500].map((cny) => (
            <button
              key={cny}
              onClick={() => handleCnyChange(String(cny))}
              className="py-1 px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 rounded-lg transition font-mono"
            >
              ¥{cny} = <span className="font-bold">{Math.round(cny * exchangeRate).toLocaleString()}원</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Group Members Manager */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>정산 동행자 ({members.length}명)</span>
          </h3>
          <span className="text-[10px] text-slate-400">지출 등록 시 분담 멤버로 자동 연동</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {members.map((member) => (
            <div
              key={member}
              className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-200"
            >
              <span>{member}</span>
              {members.length > 1 && (
                <button
                  onClick={() => handleRemoveMember(member)}
                  className="text-slate-500 hover:text-red-400 ml-1"
                >
                  &times;
                </button>
              )}
            </div>
          ))}

          <div className="flex items-center space-x-1">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="동행자 추가..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 w-28 focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleAddMember}
              className="p-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-xl"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Add Expense Form */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-md">
        <h3 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
          <Receipt className="w-4 h-4 text-amber-400" />
          <span>공동 경비 지출 내역 등록</span>
        </h3>

        <form onSubmit={handleAddExpense} className="space-y-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">지출 내역명 *</label>
              <input
                type="text"
                required
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                placeholder="예: 맥주박물관 흑맥주"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">금액 (CNY ¥) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={expenseAmountCny}
                onChange={(e) => setExpenseAmountCny(e.target.value)}
                placeholder="0.0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-amber-400 font-bold placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">결제자 (누가 냈나요?)</label>
              <select
                value={expensePayer}
                onChange={(e) => setExpensePayer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none"
              >
                {members.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">카테고리</label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none"
              >
                <option value="식사/맥주">식사/맥주</option>
                <option value="교통">교통 (택시/지하철)</option>
                <option value="입장료">입장료</option>
                <option value="쇼핑">쇼핑/마트</option>
                <option value="숙소">숙소</option>
                <option value="기타">기타</option>
              </select>
            </div>
          </div>

          {/* Split members checkboxes */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">함께 나눌 멤버 (N빵 대상)</label>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const isSelected = selectedSplitMembers.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSplitMembers(selectedSplitMembers.filter((sm) => sm !== m));
                      } else {
                        setSelectedSplitMembers([...selectedSplitMembers, m]);
                      }
                    }}
                    className={`py-1 px-2.5 rounded-lg text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    {m} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition shadow-md"
          >
            지출 내역 추가하기
          </button>
        </form>
      </div>

      {/* 4. Settlement Matrix & Final Summary */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3.5 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>정산 결과 (N빵 계산표)</span>
          </h3>
          <div className="text-right">
            <span className="text-[11px] text-slate-400">총 지출: </span>
            <span className="text-amber-400 font-black text-xs">¥{totalSpentCny.toFixed(1)}</span>
            <span className="text-[10px] text-cyan-400 ml-1">({totalSpentKrw.toLocaleString()}원)</span>
          </div>
        </div>

        {settlements.length === 0 ? (
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
            모든 정산이 완료되었거나 지출 내역이 균등합니다.
          </div>
        ) : (
          <div className="space-y-2">
            {settlements.map((st, i) => (
              <div
                key={i}
                className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-red-300">{st.from}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-bold text-emerald-300">{st.to}</span>
                  <span className="text-slate-400 text-[10px]">에게 송금</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-amber-400 block text-sm">
                    {st.amountKrw.toLocaleString()}원
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">(¥{st.amountCny})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Expense Items List */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-md">
        <h3 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
          <Receipt className="w-4 h-4 text-slate-400" />
          <span>지출 내역 목록 ({expenses.length}건)</span>
        </h3>

        {expenses.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">등록된 지출 내역이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {expenses.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="space-y-1 truncate pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-slate-200">{item.title}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="text-cyan-400">{item.payer} 결제</span>
                    <span>·</span>
                    <span>분담: {item.splitMembers.join(', ')}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-400 block">¥{item.amountCny}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {Math.round(item.amountCny * exchangeRate).toLocaleString()}원
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteExpense(item.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg bg-slate-900 hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
