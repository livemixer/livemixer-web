import lmsLogo from '/lms.svg'
import './App.css'

function App() {
  return (
    <div style={{ position: 'fixed', top: '20px', left: '20px' }}>
      <img
        src={lmsLogo}
        style={{ width: '60px', height: '60px' }}
        alt="LMS logo"
      />
    </div>
  )
}

export default App
