"use client";

import { useEffect } from "react";
import styles from "./css/topLoadingBar.module.css";
import { useStore } from "../context/store";

export default function TopLoadingBar() {
    const { topLineLoad, setTopLineLoad } = useStore();

    useEffect(() => {
        const timer = setTimeout(() => {
            setTopLineLoad(false);
        }, 4000);

        return () => {
            clearTimeout(timer);
        };
    }, [topLineLoad, setTopLineLoad]);

    return (
        <div
            className={`${styles.topLoadingBar} ${topLineLoad ? styles.active : ""
                }`}
        >
            <div className={styles.topLoadingProgress} />
        </div>
    );
}