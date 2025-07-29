import Layout from "./Layout.jsx";
import Login from "./Login.jsx";
import ProtectedRoute from "../components/auth/ProtectedRoute.jsx";

import Tasks from "./Tasks";
import Events from "./Events";
import Calendar from "./Calendar";
import WorkHours from "./WorkHours";
import PersonalSpace from "./PersonalSpace";
import TeamManagement from "./TeamManagement";
import Settings from "./Settings";
import Archive from "./Archive";
import Clients from "./Clients";
import SeasonalClients from "./SeasonalClients";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Tasks: Tasks,
    
    Events: Events,
    
    Calendar: Calendar,
    
    WorkHours: WorkHours,
    
    PersonalSpace: PersonalSpace,
    
    TeamManagement: TeamManagement,
    
    Settings: Settings,
    
    Archive: Archive,
    
    Clients: Clients,
    
    SeasonalClients: SeasonalClients,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Routes>
            {/* Public route - Login page */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes - All other pages */}
            <Route path="/*" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Routes>
                            <Route path="/" element={<Tasks />} />
                            <Route path="/Tasks" element={<Tasks />} />
                            <Route path="/Events" element={<Events />} />
                            <Route path="/Calendar" element={<Calendar />} />
                            <Route path="/WorkHours" element={<WorkHours />} />
                            <Route path="/PersonalSpace" element={<PersonalSpace />} />
                            <Route path="/TeamManagement" element={<TeamManagement />} />
                            <Route path="/Settings" element={<Settings />} />
                            <Route path="/Archive" element={<Archive />} />
                            <Route path="/Clients" element={<Clients />} />
                            <Route path="/SeasonalClients" element={<SeasonalClients />} />
                        </Routes>
                    </Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}