import React, { Component } from 'react';

class Header extends Component {
    render() {
        return (
            <div>
                TODO List / {this.props.data}
            </div>
        );
    }
}

Header.propTypes = {

};

export default Header;