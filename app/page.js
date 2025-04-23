'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function Explorer() {
  // State management
  const [configRegistry, setConfigRegistry] = useState(null);
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [level1Config, setLevel1Config] = useState(null);
  const [level2Config, setLevel2Config] = useState(null);
  const [selectedLevel1Item, setSelectedLevel1Item] = useState('');
  const [selectedLevel2Item, setSelectedLevel2Item] = useState('');
  const [filteredLevel2Items, setFilteredLevel2Items] = useState([]);
  const [itemDetails, setItemDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load configuration registry on component mount
  useEffect(() => {
    async function loadConfigRegistry() {
      try {
        const registryResponse = await fetch('/data/config-registry.json');
        
        if (!registryResponse.ok) {
          throw new Error('Failed to load configuration registry');
        }

        const registryData = await registryResponse.json();
        setConfigRegistry(registryData);
        
        // If there's only one configuration, select it automatically
        if (registryData.apps.length === 1) {
          setSelectedConfigId(registryData.apps[0].id);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading configuration registry:', err);
        setError('Failed to load application registry. Please try again later.');
        setLoading(false);
      }
    }

    loadConfigRegistry();
  }, []);

  // Load selected configuration when configId changes
  useEffect(() => {
    if (!selectedConfigId || !configRegistry) return;

    async function loadSelectedConfiguration() {
      try {
        setLoading(true);
        
        // Find the selected configuration in the registry
        const selectedConfig = configRegistry.apps.find(app => app.id === selectedConfigId);
        
        if (!selectedConfig) {
          throw new Error('Selected configuration not found');
        }

        // Load both configuration files for the selected app
        const [level1Response, level2Response] = await Promise.all([
          fetch(selectedConfig.level1Config),
          fetch(selectedConfig.level2Config)
        ]);

        if (!level1Response.ok || !level2Response.ok) {
          throw new Error('Failed to load configuration files');
        }

        const level1Data = await level1Response.json();
        const level2Data = await level2Response.json();

        setLevel1Config(level1Data);
        setLevel2Config(level2Data);
        
        // Reset selections
        setSelectedLevel1Item('');
        setSelectedLevel2Item('');
        setFilteredLevel2Items([]);
        setItemDetails(null);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading selected configuration:', err);
        setError('Failed to load selected configuration. Please try again later.');
        setLoading(false);
      }
    }

    loadSelectedConfiguration();
  }, [selectedConfigId, configRegistry]);

  // Handle Config Registry dropdown change
  const handleConfigChange = (e) => {
    const configId = e.target.value;
    setSelectedConfigId(configId);
  };

  // Handle Level 1 dropdown change
  const handleLevel1Change = (e) => {
    const level1Id = e.target.value;
    setSelectedLevel1Item(level1Id);
    setSelectedLevel2Item('');
    setItemDetails(null);

    if (!level1Id) {
      setFilteredLevel2Items([]);
      return;
    }

    // Filter Level 2 items based on Level 1 selection
    const filtered = level2Config.items.filter(item => 
      item.id.startsWith(level1Id)
    );
    setFilteredLevel2Items(filtered);
  };

  // Handle Level 2 dropdown change
  const handleLevel2Change = (e) => {
    const level2Id = e.target.value;
    setSelectedLevel2Item(level2Id);
    
    // Automatically display details when a level 2 item is selected
    if (!level2Id) {
      setItemDetails(null);
      return;
    }

    const selectedItem = level2Config.items.find(
      item => item.id === level2Id
    );
    setItemDetails(selectedItem);
  };

  if (loading && !configRegistry) {
    return <div className={styles.container}>Loading explorer...</div>;
  }

  if (error) {
    return <div className={styles.container}>
      <div className={styles.error}>{error}</div>
    </div>;
  }

  return (
    <main className={styles.container}>
      <h1>Style Explorer</h1>
      
      <div className={styles.controls}>
        {/* Config Registry Dropdown */}
        <div>
          <label htmlFor="config-dropdown">Configuration:</label>
          <select 
            id="config-dropdown"
            value={selectedConfigId}
            onChange={handleConfigChange}
          >
            <option value="">-- Select Configuration --</option>
            {configRegistry?.apps.map(app => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Level 1 Dropdown - Only show if a config is selected */}
        {level1Config && (
          <div>
            <label htmlFor="level1-dropdown">{level1Config.firstLevelLabel || "Level 1"}:</label>
            <select 
              id="level1-dropdown"
              value={selectedLevel1Item}
              onChange={handleLevel1Change}
              disabled={loading}
            >
              <option value="">-- Select --</option>
              {level1Config.items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Level 2 Dropdown - Only show if level 1 is selected */}
        {level2Config && selectedLevel1Item && (
          <div>
            <label htmlFor="level2-dropdown">{level1Config.secondLevelLabel || "Level 2"}:</label>
            <select 
              id="level2-dropdown"
              value={selectedLevel2Item}
              onChange={handleLevel2Change}
              disabled={loading || filteredLevel2Items.length === 0}
            >
              <option value="">-- Select --</option>
              {filteredLevel2Items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className={styles.contentArea}>
        {loading && selectedConfigId && (
          <p>Loading configuration...</p>
        )}
        
        {!selectedConfigId && configRegistry && (
          <p>Please select a configuration to begin.</p>
        )}
        
        {!loading && selectedConfigId && !selectedLevel1Item && (
          <p>Select {level1Config?.firstLevelLabel || "a category"} to continue.</p>
        )}
        
        {!loading && selectedLevel1Item && !selectedLevel2Item && (
          <p>Select {level1Config?.secondLevelLabel || "an item"} to view details.</p>
        )}
        
        {itemDetails && (
          <div className={styles.itemDetails}>
            <h2>{itemDetails.name}</h2>
            
            {itemDetails.sections.map((section, index) => (
              <div key={index} className={styles.section}>
                {itemDetails.sectionProperties.map(propName => {
                  // Only render if the section has this property and it's not empty
                  if (!section[propName]) return null;
                  
                  // Render each property as a basic HTML element
                  if (propName === itemDetails.sectionProperties[0]) {
                    // First property is usually a heading/title
                    return <h3 key={propName}>{section[propName]}</h3>;
                  } else {
                    // All other properties are paragraphs
                    return <p key={propName} className={styles[propName] || ''}>{section[propName]}</p>;
                  }
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}