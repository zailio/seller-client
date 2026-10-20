import { useState } from 'react';
import styles from './css/keyupload.module.css';


const predefinedOptions = [
    { "label": "Size" },
    { "label": "Weight" },
    { "label": "In Box" },
    { "label": "W-Type" },
    { "label": "W-Time" },
    { "label": "Material" },
    { "label": "Colors" },
    { "label": "Compatible" },
    { "label": "Power" },
    { "label": "Battery?" },
    { "label": "B-Type" },
    { "label": "Import?" },
    { "label": "Origin" },
    { "label": "Pack Type" },
    { "label": "Certs" },
    { "label": "Model#" },
    { "label": "Custom?" },
    { "label": "Pack" },
    { "label": "Expiry" },
    { "label": "Storage" },
    { "label": "Shelf" },
    { "label": "Usage" },
    { "label": "Install?" },
    { "label": "Extras" }
];

const KeyValueSelector = ({
    addNotification,
    selectedHighlight,
    setSelectedHighlight
}) => {
    const [selectedOption, setSelectedOption] = useState('');
    const [predefinedValue, setPredefinedValue] = useState('');
    const [customLabel, setCustomLabel] = useState('');
    const [customValue, setCustomValue] = useState('');

    const handleAddPredefined = () => {
        if (!selectedOption) {
            return addNotification({
                h2: 'key ?',
                desc: 'Please select a key first'
            });
        }

        if (!predefinedValue) {
            return addNotification({
                h2: 'value ?',
                desc: 'Please enter a value'
            });
        }

        const option = predefinedOptions.find(opt => opt.label === selectedOption);
        addItem({
            label: option.label,
            inputValue: predefinedValue
        });

        setPredefinedValue('');
    };

    const handleAddCustom = () => {
        if (!customLabel) {
            return addNotification({
                h2: 'label ?',
                desc: 'Please enter a label'
            });
        }

        if (!customValue) {
            return addNotification({
                h2: 'value ?',
                desc: 'Please select a value first'
            });
        }

        addItem({
            label: customLabel,
            inputValue: customValue
        });

        setCustomLabel('');
        setCustomValue('');
    };

    const addItem = (item) => {
        setSelectedHighlight(prevItems => {
            const existingIndex = prevItems.findIndex(i => i.label === item.label);
            if (existingIndex >= 0) {
                if (confirm(`Value "${item.label}" already exists. Replace it?`)) {
                    const newItems = [...prevItems];
                    newItems[existingIndex] = item;
                    return newItems;
                }
                return prevItems;
            }
            return [...prevItems, item];
        });
    };

    const removeItem = (label) => {
        setSelectedHighlight(prevItems => prevItems.filter(item => item.label !== label));
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.h1}>Key-Value Pair Selector</h2>

            <div className={styles.selectorContainer}>
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Predefined Options</h2>
                    <select
                        className={styles.select}
                        value={selectedOption}
                        onChange={(e) => setSelectedOption(e.target.value)}
                    >
                        <option value="">-- Select a predefined option --</option>
                        {predefinedOptions.map(option => (
                            <option key={option.label} value={option.label}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        className={styles.input}
                        value={predefinedValue}
                        onChange={(e) => setPredefinedValue(e.target.value)}
                        placeholder="Enter value..."
                    />
                    <button className={styles.button} onClick={handleAddPredefined}>
                        Add Selected
                    </button>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Custom Option</h2>
                    <input
                        type="text"
                        className={styles.input}
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        placeholder="Enter label..."
                    />
                    <input
                        type="text"
                        className={styles.input}
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        placeholder="Enter value..."
                    />
                    <button className={styles.button} onClick={handleAddCustom}>
                        Add Custom
                    </button>
                </div>
            </div>

            <div className={styles.selectedItems}>
                <h2>Selected key & values ({selectedHighlight.length})</h2>
                {selectedHighlight.length === 0 ? (
                    <p>No items selected yet.</p>
                ) : (
                    <div className={styles.itemsList}>
                        {selectedHighlight.map(item => (
                            <div key={item.label} className={styles.item}>
                                <div className={styles.itemHeader}>
                                    <span className={styles.itemLabel}>{item.label}</span>
                                    <button
                                        className={styles.removeButton}
                                        onClick={() => removeItem(item.label)}
                                    >
                                        Remove
                                    </button>
                                </div>
                                <div className={styles.itemValue}>{item.inputValue}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KeyValueSelector;