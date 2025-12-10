import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-50 h-screen flex flex-col gap-4 overflow-auto text-red-900">
                    <h2 className="text-lg font-bold">Something went wrong.</h2>
                    <p className="font-mono text-sm bg-red-100 p-2 rounded">
                        {this.state.error && this.state.error.toString()}
                    </p>
                    <details className="whitespace-pre-wrap text-xs font-mono bg-white p-2 border border-red-200">
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Reload Extension
                    </button>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false });
                            // Attempt to reset state via prop or reload logic if specific
                        }}
                        className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-100"
                    >
                        Clear Error
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
