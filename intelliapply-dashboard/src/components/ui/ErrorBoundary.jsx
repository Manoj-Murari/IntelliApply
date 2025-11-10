import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) { 
        super(props); 
        this.state = { hasError: false }; 
    }
    static getDerivedStateFromError(error) { 
        return { hasError: true }; 
    }
    componentDidCatch(error, errorInfo) { 
        console.error("Error Boundary caught:", error, errorInfo); 
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 text-center">
                    <p className="text-red-500 font-semibold">Something went wrong.</p>
                    <button 
                        onClick={() => this.setState({ hasError: false })} 
                        className="mt-2 px-4 py-2 bg-sky-100 text-sky-700 rounded-md"
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}