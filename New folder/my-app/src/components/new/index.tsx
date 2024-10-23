// pages/index.js
import { useState } from 'react';
import styles from '../../styles/Widget.module.css';

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <>
    <div className={styles.widgetContainer}>
      {/* Bottom-fixed widget icon */}
      <div className={styles.widgetIcon} onClick={toggleDrawer}>
        <img src="/icon.png" alt="Widget Icon" />
      </div>

      {/* Drawer component */}
      {drawerOpen && (
        <div className={styles.drawer}>
          <div className={styles.drawerContent}>
            <h2>Widget Drawer</h2>
            <p>This is the content inside the drawer.</p>
            <button onClick={toggleDrawer}>Close</button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
