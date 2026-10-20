'use client';

import React from "react";
import styles from './css/popup.module.css';
import { IoMdClose } from "react-icons/io";
import { IoCopyOutline } from "react-icons/io5";
import { FaCheckCircle, FaTruck, FaRegCircle } from "react-icons/fa";
import Wait from '../../../../components/wait';

const formatWhen = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const splitLine = (line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return { event: line, rest: '' };
    return { event: line.slice(0, idx).trim(), rest: line.slice(idx + 1).trim() };
};

const StepIcon = ({ status }) => {
    if (status === 'completed') return <FaCheckCircle />;
    if (status === 'active') return <FaTruck />;
    return <FaRegCircle />;
};

export default function PopUp({
    showSomething,
    setShowSomeThing,
    showData
}) {

    return (
        <div className={styles.overlay} onClick={() => setShowSomeThing(false)}>
            <div className={styles.popUp} onClick={(e) => e.stopPropagation()}>
                <div className={styles.inVentery}>
                    <div
                        onClick={() => setShowSomeThing(false)}
                        className={styles.copyPopUp + ' ' + styles.commonTopPopUp}
                    >
                        <IoCopyOutline size={20} />
                    </div>
                    <div
                        onClick={() => setShowSomeThing(false)}
                        className={styles.closePopUp + ' ' + styles.commonTopPopUp}
                    >
                        <IoMdClose size={25} />
                    </div>
                </div>
                <div className={styles.popUpDatas}>
                    {
                        !showData?.[showSomething.type]?.[showSomething.id]
                            ? <Wait />
                            : <div style={{
                                marginTop: '40px'
                            }}>
                                {
                                    Object.entries(showData[showSomething.type][showSomething.id]).map(([key, value]) => (
                                        <React.Fragment key={showSomething.id + key}>
                                            {
                                                key === 'tableData'
                                                    ? <div>
                                                        <h3 className={styles.popUpHead}>{value.mainHead}</h3>
                                                        <table className={styles.popUpTable}>
                                                            <thead>
                                                                <tr key={'th' + key}>
                                                                    {
                                                                        value.head.map((data, key) => (
                                                                            <th rowSpan={data.span} key={'th' + key}>{data.label}</th>
                                                                        ))
                                                                    }
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {value.value.map((data, key) => (
                                                                    <tr key={'tr' + key} >
                                                                        {
                                                                            data.map((value, key) => (
                                                                                <td key={'td' + key} colSpan={1}>{value}</td>
                                                                            ))
                                                                        }
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    : key === 'productData'
                                                        ? <div className={styles.productData}>
                                                            <div className={styles.imgPart}>
                                                                <img src={value.image} alt={value.title} />
                                                            </div>
                                                            <div className={styles.dataPart}>
                                                                <h5>{value.title}</h5>
                                                                <span>{value.price}</span>
                                                            </div>
                                                        </div>
                                                        : key === 'updates'
                                                            ? (!value?.list?.length
                                                                ? null
                                                                : <div>
                                                                    <div className={styles.timelineHeadRow}>
                                                                        <h3 className={styles.popUpHead}>Tracking</h3>
                                                                        {value.lastUpdated && (
                                                                            <span className={styles.timelineUpdated}>
                                                                                Updated {formatWhen(value.lastUpdated)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <ol className={styles.timeline}>
                                                                        {value.list.map((step, idx) => {
                                                                            const lines = Array.isArray(step.subtitles)
                                                                                ? step.subtitles
                                                                                : (step.subtitle ? [step.subtitle] : []);
                                                                            const statusClass = step.status === 'completed'
                                                                                ? styles.timelineStepCompleted
                                                                                : step.status === 'active'
                                                                                    ? styles.timelineStepActive
                                                                                    : styles.timelineStepPending;
                                                                            return (
                                                                                <li key={idx} className={`${styles.timelineStep} ${statusClass}`}>
                                                                                    <span className={styles.timelineIcon}>
                                                                                        <StepIcon status={step.status} />
                                                                                    </span>
                                                                                    <div className={styles.timelineBody}>
                                                                                        <span className={styles.timelineTitle}>{step.title}</span>
                                                                                        {lines.length > 0 && (
                                                                                            <ul className={styles.timelineEvents}>
                                                                                                {lines.map((line, i) => {
                                                                                                    const { event, rest } = splitLine(line);
                                                                                                    return (
                                                                                                        <li key={i} className={styles.timelineEvent}>
                                                                                                            <strong>{event}</strong>{rest ? `: ${rest}` : ''}
                                                                                                        </li>
                                                                                                    );
                                                                                                })}
                                                                                            </ul>
                                                                                        )}
                                                                                    </div>
                                                                                </li>
                                                                            );
                                                                        })}
                                                                    </ol>
                                                                </div>
                                                            )
                                                            : <div>
                                                                <h3 className={styles.popUpHead}>{key}</h3>
                                                                {
                                                                    Object.entries(value).map(([key, value]) => (
                                                                        <p key={key + 'subdata'} className={styles.popUpData}>
                                                                            <strong>{key}</strong>
                                                                            <span>{value}</span>
                                                                        </p>
                                                                    ))
                                                                }
                                                            </div>
                                            }
                                        </React.Fragment>
                                    ))
                                }
                            </div>
                    }
                </div>
            </div>
        </div>
    )
};