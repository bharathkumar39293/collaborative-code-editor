import './App.css';
import React, { Suspense, lazy } from 'react';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import {Toaster} from 'react-hot-toast';
import {RecoilRoot} from "recoil";

const Home = lazy(() => import('./pages/Home'));
const EditorPage = lazy(() => import('./pages/EditorPage'));

function App() {

    return (
        <>
            <div>
                <Toaster
                    position="top-center"
                    toastOptions={{
                        success: {
                            theme: {
                                primary: '#4aed88',
                            },
                        },
                    }}
                ></Toaster>
            </div>
            <BrowserRouter>
                <RecoilRoot>
                    <Suspense fallback={<div>Loading...</div>}>
                        <Routes>
                            <Route path="/" element={<Home />}></Route>
                            <Route
                                path="/editor/:roomId"
                                element={<EditorPage />}
                            ></Route>
                        </Routes>
                    </Suspense>
                </RecoilRoot>
            </BrowserRouter>
        </>
    );
}

export default App;