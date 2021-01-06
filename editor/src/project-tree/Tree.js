import React, { useState } from 'react';
import { Treebeard, decorators } from 'react-treebeard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFile, faAngleRight, faAngleDown } from '@fortawesome/free-solid-svg-icons';

const testData = {
    name: 'Far Star',
    toggled: true,
    children: [
        {
            name: 'translations',
            children: [
                { name: 'test.csv' },
                { name: 'en.csv' }
            ]
        },
        {
            name: 'text',
            loading: true,
            children: []
        },
        {
            name: 'dialogues',
            children: [
                { name: 'captain.clyde' },
                { name: 'npc.clyde' }
            ]
        }
    ]
};

const CustomHeader = ({ node, style }) =>{
    const iconType = node.children ? faFolder : faFile;
    const iconStyle = {marginRight: '5px'};
    const toggleIcon = node.toggled ? faAngleDown : faAngleRight;
    return(
        <div style={style.base}>
            <div style={{ ...style.title }}>
                { node.children ? <FontAwesomeIcon icon={toggleIcon} style={iconStyle}/> : <FontAwesomeIcon icon={iconType} style={iconStyle}/> }
                {node.name}
            </div>
        </div>
    )
};

const CustomToggle = () => {
    return <span/>;
};

export default function Tree() {
    const [data, setData] = useState(testData);
    const [cursor, setCursor] = useState(false);

    const onToggle = (node, toggled) => {
        if (cursor) {
            cursor.active = false;
        }
        node.active = true;
        if (node.children) {
            node.toggled = toggled;
        }
        setCursor(node);
        setData(Object.assign({}, data))
    }

    return (
        <Treebeard
            data={data}
            onToggle={onToggle}
            decorators={{...decorators, Header: CustomHeader, Toggle: CustomToggle}}
        />
    );
}

