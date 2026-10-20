import { useState } from "react";
import { BiDotsVerticalRounded } from "react-icons/bi";
import styles from "./css/dots.module.css"; // Import CSS Module

const DotMenu = ({ className, size, options }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Toggle the menu
    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    // Close the menu when clicking outside
    const closeMenu = () => {
        setIsOpen(false);
    };

    return (
        <div className={className ? `${className} ${styles.dot_menu}` : styles.dot_menu} onClick={toggleMenu}>
            <BiDotsVerticalRounded className={styles.dots_icon} size={size} />

            {isOpen && (
                <div className={styles.options_container}>{
                    options.map((a, _) => {
                        const IconComponent = a.component;
                        return (
                            <div
                                key={_}
                                className={styles.option}
                                onClick={() => {
                                    if (a.fn) a.fn(...a.attrs); // Call the function with attributes
                                    closeMenu(); // Close the menu after clicking an option
                                }}
                                style={{
                                    color: a.color ? a.color : ''
                                }}>
                                {IconComponent && <IconComponent />}
                                < div className={styles.text}>{a.title}</div>
                            </div>
                        )
                    })
                }
                </div>
            )
            }

            {isOpen && <div className={styles.overlay} onClick={closeMenu}></div>}
        </div >
    );
};

export default DotMenu;