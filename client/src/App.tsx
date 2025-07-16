import {BrowserRouter as Router,Routes,Route,} from "react-router-dom";
import "./App.css";
import Home from "./components/home.tsx";

const App = ()=> {
    return (
      <div>
        <Router>
          <div>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </div>
        </Router>
      </div>
    );
  }

export default App;