// cash-flow-front/src/App.jsx

import ClientsPage from './pages/Clients/ClientsPage'; // o ClientPage si lo dejaste en singular
import LoansPage from './pages/Loans/LoansPage';

function App() {
  return (
    <div>
      <header style={{ background: '#222', color: 'white', padding: '15px', textAlign: 'center' }}>
        <h1>Cash Flow & Préstamos</h1>
      </header>
      
      <ClientsPage />
      <LoansPage />
    </div>
  );
}

export default App;