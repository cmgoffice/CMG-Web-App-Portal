import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in React Component Tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6 font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-triangle-exclamation text-2xl"></i>
            </div>
            <h1 className="text-xl font-bold mb-2">เกิดข้อผิดพลาดของระบบ</h1>
            <p className="text-slate-400 text-sm mb-4">
              ขออภัย แอปพลิเคชันพบข้อผิดพลาดที่ไม่คาดคิด
            </p>
            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-lg text-left text-xs font-mono text-red-300 overflow-x-auto mb-6 max-h-40 border border-red-950">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <i className="fas fa-rotate-right"></i> โหลดหน้าใหม่
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
