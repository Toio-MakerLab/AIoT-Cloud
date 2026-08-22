import { createElement } from "react";

export const renderIcon = (Icon?: React.ElementType) =>
	Icon ? createElement(Icon) : null;
