import React, { useMemo } from 'react';
import { Target, User, Search, FileText, Percent, Award } from 'lucide-react';

// A reusable card for displaying a key statistic
function StatCard({ title, value, icon, note }) {
    const Icon = icon;
    return (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-4xl font-bold text-slate-800 mt-1">{value}</p>
                </div>
                <div className="p-3 rounded-full bg-sky-100 text-sky-600">
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            {note && <p className="text-xs text-slate-400 mt-2">{note}</p>}
        </div>
    );
}

// A reusable component for the performance tables
function PerformanceTable({ title, data, columns, icon }) {
    const Icon = icon;
    return (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Icon className="w-5 h-5 text-slate-600" />
                {title}
            </h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {columns.map((col, index) => (
                                <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {data.length > 0 ? data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-slate-50">
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                        {row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-8 text-slate-500">
                                    Not enough data to analyze.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


export default function Analytics({ jobs, profiles, searches }) {
    // --- DATA CALCULATION ---
    const analyticsData = useMemo(() => {
        const trackedJobs = jobs.filter(job => job.is_tracked);
        const appliedCount = trackedJobs.length;
        const interviewingCount = trackedJobs.filter(job => job.status === 'Interviewing').length;
        const offerCount = trackedJobs.filter(job => job.status === 'Offer').length;
        
        // Calculate interview rate, avoiding division by zero
        const interviewRate = appliedCount > 0 ? ((interviewingCount / appliedCount) * 100).toFixed(1) : "0.0";

        // Profile Performance Calculation
        const profilePerformance = profiles.map(profile => {
            const jobsForProfile = trackedJobs.filter(job => {
                const search = searches.find(s => s.id === job.search_id);
                return search && search.profile_id === profile.id;
            });
            const apps = jobsForProfile.length;
            const interviews = jobsForProfile.filter(j => j.status === 'Interviewing').length;
            const rate = apps > 0 ? ((interviews / apps) * 100).toFixed(1) + "%" : "N/A";
            return {
                name: profile.profile_name,
                applications: apps,
                interviews: interviews,
                interviewRate: rate
            };
        });

        // Search Term Performance Calculation
        const searchPerformance = searches.map(search => {
            const jobsForSearch = trackedJobs.filter(job => job.search_id === search.id);
            const apps = jobsForSearch.length;
            const interviews = jobsForSearch.filter(j => j.status === 'Interviewing').length;
            const rate = apps > 0 ? ((interviews / apps) * 100).toFixed(1) + "%" : "N/A";
            return {
                name: search.search_term,
                applications: apps,
                interviews: interviews,
                interviewRate: rate
            };
        });

        return { appliedCount, interviewingCount, offerCount, interviewRate, profilePerformance, searchPerformance };
    }, [jobs, profiles, searches]);

    const profileColumns = [
        { header: 'Profile Name', accessor: 'name' },
        { header: 'Applications', accessor: 'applications' },
        { header: 'Interviews', accessor: 'interviews' },
        { header: 'Interview Rate', accessor: 'interviewRate' },
    ];

    const searchColumns = [
        { header: 'Search Term', accessor: 'name' },
        { header: 'Applications', accessor: 'applications' },
        { header: 'Interviews', accessor: 'interviews' },
        { header: 'Interview Rate', accessor: 'interviewRate' },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Proactive Career Agent</h2>

            {/* Section 1: Job Search Funnel */}
            <div className="mb-8">
                 <h3 className="text-lg font-semibold text-slate-700 mb-4">Your Job Search Funnel</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Applications Sent" value={analyticsData.appliedCount} icon={FileText} note="Total jobs added to your tracker." />
                    <StatCard title="Interviews Landed" value={analyticsData.interviewingCount} icon={Target} note="Jobs moved to the 'Interviewing' stage." />
                    <StatCard title="Job Offers" value={analyticsData.offerCount} icon={Award} note="Jobs moved to the 'Offer' stage." />
                    <StatCard title="Interview Rate" value={`${analyticsData.interviewRate}%`} icon={Percent} note="The percentage of applications that lead to an interview." />
                </div>
            </div>

            {/* Section 2: Profile Performance */}
            <div className="mb-8">
                <PerformanceTable 
                    title="Profile Performance"
                    data={analyticsData.profilePerformance}
                    columns={profileColumns}
                    icon={User}
                />
            </div>

            {/* Section 3: Search Term Performance */}
            <div>
                 <PerformanceTable 
                    title="Search Term Performance"
                    data={analyticsData.searchPerformance}
                    columns={searchColumns}
                    icon={Search}
                />
            </div>
        </div>
    );
}
