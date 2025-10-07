import React from 'react';
import useTransactions from '../hooks/useTransactions';
import useBudgets from '../hooks/useBudgets';
import useGoals from '../hooks/useGoals';

/**
 * PUBLIC_INTERFACE
 * Dashboard - overview with summaries
 */
export default function Dashboard() {
  const { data: transactions, loading: txLoading, error: txError } = useTransactions();
  const { data: budgets, loading: bLoading, error: bError } = useBudgets();
  const { data: goals, loading: gLoading, error: gError } = useGoals();

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>
      <div className="page-grid">
        <section className="card span-4">
          <h3>Recent Transaction</h3>
          {txLoading && <div className="skeleton" style={{height: 16, width: '80%'}} />}
          {txError && <div className="helper">Error loading transactions</div>}
          {!txLoading && !txError && transactions?.length ? (
            <div className="helper">{transactions[0].category} • ${transactions[0].amount}</div>
          ) : (!txLoading && <div className="helper">No transactions yet</div>)}
        </section>

        <section className="card span-4">
          <h3>Budget Status</h3>
          {bLoading && <div className="skeleton" style={{height: 16, width: '70%'}} />}
          {bError && <div className="helper">Error loading budgets</div>}
          {!bLoading && !bError && budgets?.length ? (
            <div className="helper">{budgets[0].category} • {Math.round((budgets[0].spent/budgets[0].limit)*100)}% used</div>
          ) : (!bLoading && <div className="helper">No budgets yet</div>)}
        </section>

        <section className="card span-4">
          <h3>Goal Progress</h3>
          {gLoading && <div className="skeleton" style={{height: 16, width: '60%'}} />}
          {gError && <div className="helper">Error loading goals</div>}
          {!gLoading && !gError && goals?.length ? (
            <div className="helper">{goals[0].name} • ${goals[0].progress}/${goals[0].target}</div>
          ) : (!gLoading && <div className="helper">Set your first goal</div>)}
        </section>

        <section className="card span-12">
          <h3>Insights</h3>
          <div className="helper">Insights will appear here once there is more data.</div>
        </section>
      </div>
    </div>
  );
}
