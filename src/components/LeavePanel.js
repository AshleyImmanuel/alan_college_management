import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { authFetch } from './authClient';
import './LeavePanel.css';

const TARGET_LABEL_MAP = {
    student: 'Faculty',
    faculty: 'HOD',
    hod: 'Admin'
};

const SOURCE_LABEL_MAP = {
    faculty: 'Student',
    hod: 'Faculty',
    admin: 'HOD'
};

const getTodayDateKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const LeavePanel = ({
    role,
    canApply = false,
    showInbox = false,
    initialName = '',
    inboxTitle = '',
    onToast = null
}) => {
    const [name, setName] = useState(initialName);
    const [reason, setReason] = useState('');
    const [fromDate, setFromDate] = useState(getTodayDateKey());
    const [toDate, setToDate] = useState(getTodayDateKey());
    const [submitting, setSubmitting] = useState(false);
    const [myLeaves, setMyLeaves] = useState([]);
    const [inboxLeaves, setInboxLeaves] = useState([]);
    const [loadingMyLeaves, setLoadingMyLeaves] = useState(false);
    const [loadingInboxLeaves, setLoadingInboxLeaves] = useState(false);
    const [inboxStatus, setInboxStatus] = useState('pending');
    const [inboxActionKey, setInboxActionKey] = useState('');
    const [toast, setToast] = useState({ visible: false, title: '', message: '', type: 'success' });

    const emitToast = useCallback((title, message, type = 'success') => {
        if (typeof onToast === 'function') {
            onToast(title, message, type);
            return;
        }

        setToast({ visible: true, title, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3000);
    }, [onToast]);

    const fetchMyLeaves = useCallback(async () => {
        try {
            setLoadingMyLeaves(true);
            const res = await authFetch('/api/leaves/my');
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to load your leave requests.');
            }
            const data = await res.json();
            setMyLeaves(Array.isArray(data) ? data : []);
        } catch (error) {
            emitToast('Error', error.message || 'Failed to load your leave requests.', 'error');
        } finally {
            setLoadingMyLeaves(false);
        }
    }, [emitToast]);

    const fetchInboxLeaves = useCallback(async (status = inboxStatus) => {
        if (!showInbox) return;
        try {
            setLoadingInboxLeaves(true);
            const params = new URLSearchParams();
            if (status && status !== 'all') params.set('status', status);
            const query = params.toString();
            const endpoint = query ? `/api/leaves/inbox?${query}` : '/api/leaves/inbox';
            const res = await authFetch(endpoint);
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to load leave inbox.');
            }
            const data = await res.json();
            setInboxLeaves(Array.isArray(data) ? data : []);
        } catch (error) {
            emitToast('Error', error.message || 'Failed to load leave inbox.', 'error');
        } finally {
            setLoadingInboxLeaves(false);
        }
    }, [emitToast, inboxStatus, showInbox]);

    useEffect(() => {
        setName(initialName);
    }, [initialName]);

    useEffect(() => {
        fetchMyLeaves();
    }, [fetchMyLeaves]);

    useEffect(() => {
        if (!showInbox) return;
        fetchInboxLeaves(inboxStatus);
    }, [showInbox, inboxStatus, fetchInboxLeaves]);

    const applyLeave = async (event) => {
        event.preventDefault();
        const normalizedName = String(name || '').trim();
        const normalizedReason = String(reason || '').trim();
        const todayDateKey = getTodayDateKey();

        if (!normalizedName) {
            emitToast('Error', 'Name is required.', 'error');
            return;
        }
        if (!normalizedReason) {
            emitToast('Error', 'Reason is required.', 'error');
            return;
        }
        if (!fromDate || !toDate) {
            emitToast('Error', 'From and To dates are required.', 'error');
            return;
        }
        if (fromDate < todayDateKey || toDate < todayDateKey) {
            emitToast('Error', 'Past dates are not allowed.', 'error');
            return;
        }
        if (toDate < fromDate) {
            emitToast('Error', 'To date must be on or after from date.', 'error');
            return;
        }

        try {
            setSubmitting(true);
            const res = await authFetch('/api/leaves', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: normalizedName,
                    reason: normalizedReason,
                    fromDate,
                    toDate
                })
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || 'Failed to submit leave request.');
            }

            emitToast('OK', data.message || 'Leave request submitted.');
            setReason('');
            await fetchMyLeaves();
            await fetchInboxLeaves(inboxStatus);
        } catch (error) {
            emitToast('Error', error.message || 'Failed to submit leave request.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const updateLeaveStatus = async (leaveId, status) => {
        const actionKey = `${leaveId}:${status}`;
        try {
            setInboxActionKey(actionKey);
            const res = await authFetch(`/api/leaves/${leaveId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || 'Failed to update leave request.');
            }
            emitToast('Success', data.message || 'Leave request updated.');
            await fetchInboxLeaves(inboxStatus);
        } catch (error) {
            emitToast('Error', error.message || 'Failed to update leave request.', 'error');
        } finally {
            setInboxActionKey('');
        }
    };

    const incomingTitle = useMemo(() => {
        if (inboxTitle) return inboxTitle;
        const source = SOURCE_LABEL_MAP[role] || 'User';
        return `${source} Leave Requests`;
    }, [inboxTitle, role]);

    const destinationLabel = TARGET_LABEL_MAP[role] || '';

    return (
        <div className="leave-panel-stack">
            {canApply && (
                <div className="faculty-panel leave-apply-panel">
                    <div className="faculty-panel-header">
                        <h3><i className="fa-solid fa-calendar-plus"></i> Apply Leave</h3>
                    </div>
                    <div className="faculty-panel-body">
                        <form className="leave-form-grid" onSubmit={applyLeave}>
                            <div className="attendance-field">
                                <label htmlFor="leave-name">Name</label>
                                <input
                                    id="leave-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                />
                            </div>
                            <div className="attendance-field leave-date-field">
                                <label htmlFor="leave-from">From Date</label>
                                <input
                                    id="leave-from"
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>
                            <div className="attendance-field leave-date-field">
                                <label htmlFor="leave-to">To Date</label>
                                <input
                                    id="leave-to"
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>
                            <div className="attendance-field leave-reason-field">
                                <label htmlFor="leave-reason">Reason</label>
                                <textarea
                                    id="leave-reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Enter leave reason"
                                    rows={3}
                                />
                            </div>
                            {destinationLabel && (
                                <div className="leave-helper-note">
                                    This leave request will be sent to <strong>{destinationLabel}</strong>.
                                </div>
                            )}
                            <div className="leave-action-row">
                                <button type="submit" className="btn-create" disabled={submitting}>
                                    <i className={`fa-solid ${submitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                                    {submitting ? 'Submitting...' : 'Apply Leave'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showInbox && (
                <div className="faculty-panel">
                    <div className="faculty-panel-header leave-inbox-header">
                        <h3><i className="fa-solid fa-inbox"></i> {incomingTitle}</h3>
                        <div className="faculty-status-filters">
                            {['pending', 'approved', 'rejected', 'all'].map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    className={`faculty-status-filter-btn ${inboxStatus === status ? 'active' : ''}`}
                                    onClick={() => setInboxStatus(status)}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="faculty-panel-body">
                        {loadingInboxLeaves ? (
                            <div className="loading-spinner"><i className="fa-solid fa-circle-notch fa-spin"></i> Loading leave requests...</div>
                        ) : inboxLeaves.length === 0 ? (
                            <div className="empty-state compact-empty-state">No leave requests found for this filter.</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Reason</th>
                                            <th>From</th>
                                            <th>To</th>
                                            <th>Status</th>
                                            <th>Applied On</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inboxLeaves.map((leave) => {
                                            const approveActionKey = `${leave._id}:approved`;
                                            const rejectActionKey = `${leave._id}:rejected`;
                                            const actionDisabled = leave.status !== 'pending' || Boolean(inboxActionKey);
                                            return (
                                                <tr key={leave._id}>
                                                    <td className="user-name-cell">{leave.name}</td>
                                                    <td>{String(leave.requesterRole || '').toUpperCase()}</td>
                                                    <td className="leave-reason-cell">{leave.reason}</td>
                                                    <td>{leave.fromDate}</td>
                                                    <td>{leave.toDate}</td>
                                                    <td>
                                                        <span className={`status-badge status-${leave.status || 'pending'}`}>
                                                            {leave.status ? leave.status.charAt(0).toUpperCase() + leave.status.slice(1) : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="user-date-cell">
                                                        {leave.createdAt ? new Date(leave.createdAt).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td>
                                                        <div className="faculty-registration-actions">
                                                            <button
                                                                type="button"
                                                                className="btn-small faculty-btn-accept"
                                                                disabled={actionDisabled}
                                                                onClick={() => updateLeaveStatus(leave._id, 'approved')}
                                                            >
                                                                {inboxActionKey === approveActionKey ? 'Approving...' : 'Approve'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn-small faculty-btn-reject"
                                                                disabled={actionDisabled}
                                                                onClick={() => updateLeaveStatus(leave._id, 'rejected')}
                                                            >
                                                                {inboxActionKey === rejectActionKey ? 'Rejecting...' : 'Reject'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {canApply && (
                <div className="faculty-panel">
                    <div className="faculty-panel-header">
                        <h3><i className="fa-solid fa-clock-rotate-left"></i> My Leave Requests</h3>
                    </div>
                    <div className="faculty-panel-body">
                        {loadingMyLeaves ? (
                            <div className="loading-spinner"><i className="fa-solid fa-circle-notch fa-spin"></i> Loading your leave requests...</div>
                        ) : myLeaves.length === 0 ? (
                            <div className="empty-state compact-empty-state">You have not applied for leave yet.</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>Reason</th>
                                            <th>From</th>
                                            <th>To</th>
                                            <th>Status</th>
                                            <th>Applied On</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myLeaves.map((leave) => (
                                            <tr key={leave._id}>
                                                <td className="leave-reason-cell">{leave.reason}</td>
                                                <td>{leave.fromDate}</td>
                                                <td>{leave.toDate}</td>
                                                <td>
                                                    <span className={`status-badge status-${leave.status || 'pending'}`}>
                                                        {leave.status ? leave.status.charAt(0).toUpperCase() + leave.status.slice(1) : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="user-date-cell">
                                                    {leave.createdAt ? new Date(leave.createdAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {toast.visible && !onToast && (
                <div className={`toast-notification ${toast.type === 'error' ? 'toast-error' : ''}`}>
                    <div className="toast-icon">
                        <i className={`fa-solid ${toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
                    </div>
                    <div className="toast-content">
                        <p className="toast-title">{toast.title}</p>
                        <p className="toast-message">{toast.message}</p>
                    </div>
                    <button className="toast-close" onClick={() => setToast((prev) => ({ ...prev, visible: false }))}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            )}
        </div>
    );
};

export default LeavePanel;
