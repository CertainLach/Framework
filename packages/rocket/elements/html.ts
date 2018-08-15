import {_r} from './internal/r';
import {IRocketArgumentHtmlProps} from "./internal/data";
import RocketComponent from "./RocketComponent";

type IAcceptType = any;
type IAcceptCharsetType = any;
type IAccesskeyType = any;
type IActionType = any;
type IAlignType = any;
type IAltType = string;
type IAsyncType = boolean;
type IAutocompleteType = boolean;
type IAutofocusType = boolean;
type IAutoplayType = boolean;
type IBgcolorType = string;
type IBorderType = string;
type IBufferedType = any;
type IChallengeType = any;
type ICharsetType = string;
type ICheckedType = boolean;
type ICiteType = any;
type ICodeType = any;
type ICodebaseType = any;
type IColorType = string;
type IColsType = number;
type IColspanType = number;
type IContentType = any;
type IContenteditableType = any;
type IContextmenuType = any;
type IControlsType = any;
type ICoordsType = any;
type ICrossoriginType = any;
type IDataType = any;
type IDatetimeType = any;
type IDefaultType = any;
type IDeferType = boolean;
type IDirType = any;
type IDirnameType = any;
type IDisabledType = any;
type IDownloadType = boolean;
type IDraggableType = boolean;
type IDropzoneType = boolean;
type IEnctypeType = any;
type IForType = string;
type IFormType = any;
type IFormactionType = any;
type IHeadersType = any;
type IHeightType = any;
type IHiddenType = any;
type IHighType = any;
type IHrefType = string;
type IHreflangType = any;
type IHttpEquivType = any;
type IIconType = any;
type IIdType = string;
type IIntegrityType = string;
type IIsmapType = any;
type IItempropType = any;
type IKeytypeType = any;
type IKindType = any;
type ILabelType = string;
type ILangType = any;
type ILanguageType = any;
type IListType = any;
type ILoopType = any;
type ILowType = any;
type IMaxType = any;
type IMaxlengthType = any;
type IMinlengthType = any;
type IMediaType = any;
type IMethodType = any;
type IMinType = any;
type IMultipleType = any;
type IMutedType = any;
type INameType = any;
type INovalidateType = any;
type IOpenType = any;
type IOptimumType = any;
type IPatternType = any;
type IPingType = any;
type IPlaceholderType = any;
type IPosterType = any;
type IPreloadType = any;
type IRadiogroupType = any;
type IReadonlyType = any;
type IRelType = any;
type IRequiredType = any;
type IReversedType = any;
type IRowsType = any;
type IRowspanType = any;
type ISandboxType = any;
type IScopeType = any;
type IScopedType = any;
type ISeamlessType = any;
type ISelectedType = any;
type IShapeType = any;
type ISizeType = any;
type ISizesType = any;
type ISlotType = any;
type ISpanType = any;
type ISpellcheckType = any;
type ISrcType = string;
type ISrcdocType = any;
type ISrclangType = any;
type ISrcsetType = any;
type IStartType = any;
type IStepType = any;
type IStyleType = { [key: string]: string | number }; // TODO: Html tags
type ISummaryType = any;
type ITabindexType = any;
type ITargetType = any;
type ITitleType = any;
type ITypeType = any;
type IUsemapType = any;
type IValueType = any;
type IWidthType = string;
type IWrapType = any;

/**
 * Common attributes applicable to all html elements
 */
interface IHtmlAttributes extends IRocketArgumentHtmlProps {
    accesskey?: IAccesskeyType; // Defines a keyboard shortcut to activate or add focus to the element.
    contentEditable?: IContenteditableType; // Indicates whether the element's content is editable.
    contextMenu?: IContextmenuType; // Defines the ID of a <menu> element which will serve as the element's context menu.
    dir?: IDirType; // Defines the text direction. Allowed values are ltr (Left-To-Right) or rtl (Right-To-Left)
    draggable?: IDraggableType; // Defines whether the element can be dragged.
    dropZone?: IDropzoneType; // Indicates that the element accept the dropping of content on it.
    hidden?: IHiddenType; // Prevents rendering of given element, while keeping child elements, e.g. script elements, active.
    id?: IIdType; // Often used with CSS to style a specific element. The value of this attribute must be unique.
    itemProp?: IItempropType;
    lang?: ILangType; // Defines the language used in the element.
    slot?: ISlotType; // Assigns a slot in a shadow DOM shadow tree to an element.
    spellCheck?: ISpellcheckType; // Indicates whether spell checking is allowed for the element.
    style?: IStyleType; // Defines CSS styles which will override styles previously set.
    tabindex?: ITabindexType; // Overrides the browser's default tab order and follows the one specified instead.
    title?: ITitleType; // Text to be displayed in a tooltip when hovering over the element.
}

interface IFormAttributes extends IHtmlAttributes {
    accept?: IAcceptType; // List of types the server accepts, typically a file type.
    acceptCharset?: IAcceptCharsetType; // List of supported charsets.
    action?: IActionType; // The URI of a program that processes the information submitted via the form.
    autocomplete?: IAutocompleteType; // Indicates whether controls in this form can by default have their values automatically completed by the browser.
    enctype?: IEnctypeType; // Defines the content type of the form date when the method is POST.
    method?: IMethodType; // Defines which HTTP method to use when submitting the form. Can be GET (default) or POST.
    name?: INameType; // Name of the element. For example used by the server to identify the fields in form submits.
    novalidate?: INovalidateType; // This attribute indicates that the form shouldn't be validated when submitted.
    target?: ITargetType;
}

interface IInputAttributes extends IHtmlAttributes {
    accept?: IAcceptType; // List of types the server accepts, typically a file type.
    alt?: IAltType; // Alternative text in case an image can't be displayed.
    autocomplete?: IAutocompleteType; // Indicates whether controls in this form can by default have their values automatically completed by the browser.
    autoFocus?: IAutofocusType; // The element should be automatically focused after the page loaded.
    checked?: ICheckedType; // Indicates whether the element should be checked on page load.
    dirname?: IDirnameType;
    disabled?: IDisabledType; // Indicates whether the user can interact with the element.
    form?: IFormType; // Indicates the form that is the owner of the element.
    formAction?: IFormactionType; // Indicates the action of the element, overriding the action defined in the <form>.
    height?: IHeightType; // Specifies the height of elements listed here. For all other elements, use the CSS height property.
    list?: IListType; // Identifies a list of pre-defined options to suggest to the user.
    max?: IMaxType; // Indicates the maximum value allowed.
    maxLength?: IMaxlengthType; // Defines the maximum number of characters allowed in the element.
    minLength?: IMinlengthType; // Defines the minimum number of characters allowed in the element.
    min?: IMinType; // Indicates the minimum value allowed.
    multiple?: IMultipleType; // Indicates whether multiple values can be entered in an input of the type email or file.
    name?: INameType; // Name of the element. For example used by the server to identify the fields in form submits.
    pattern?: IPatternType; // Defines a regular expression which the element's value will be validated against.
    placeholder?: IPlaceholderType; // Provides a hint to the user of what can be entered in the field.
    readonly?: IReadonlyType; // Indicates whether the element can be edited.
    required?: IRequiredType; // Indicates whether this element is required to fill out or not.
    size?: ISizeType; // Defines the width of the element (in pixels). If the element's type attribute is text or password then it's the number of characters.
    src?: ISrcType; // The URL of the embeddable content.
    step?: IStepType;
    type?: ITypeType; // Defines the type of the element.
    value?: IValueType; // Defines a default value which will be displayed in the element on page load.
    width?: IWidthType; // For the elements listed here, this establishes the element's width.
}

interface IAppletAttributes extends IHtmlAttributes {
    align?: IAlignType; // Specifies the horizontal alignment of the element.
    alt?: IAltType; // Alternative text in case an image can't be displayed.
    code?: ICodeType; // Specifies the URL of the applet's class file to be loaded and executed.
    codebase?: ICodebaseType; // This attribute gives the absolute or relative URL of the directory where applets' .class files referenced by the code attribute are stored.
}

interface ICaptionAttributes extends IHtmlAttributes {
    align?: IAlignType; // Specifies the horizontal alignment of the element.
}

interface IColAttributes extends IHtmlAttributes {
    align?: IAlignType; // Specifies the horizontal alignment of the element.
    bgColor?: IBgcolorType; // Background color of the element.
    span?: ISpanType;
}

interface IColgroupAttributes extends IHtmlAttributes {
    align?: IAlignType; // Specifies the horizontal alignment of the element.
}

interface IHrAttributes extends IHtmlAttributes {
    align?: IAlignType; // Specifies the horizontal alignment of the element.
}

interface IIframeAttributes extends IHtmlAttributes {
    align?: IAlignType; // Specifies the horizontal alignment of the element.
    height?: IHeightType; // Specifies the height of elements listed here. For all other elements, use the CSS height property.
    name?: INameType; // Name of the element. For example used by the server to identify the fields in form submits.
    sandbox?: ISandboxType;
    seamless?: ISeamlessType;
    src?: ISrcType; // The URL of the embeddable content.
    srcdoc?: ISrcdocType;
    width?: IWidthType; // For the elements listed here, this establishes the element's width.
}

interface IImgAttributes extends IHtmlAttributes {
    align?: IAlignType; // Specifies the horizontal alignment of the element.
    alt?: IAltType; // Alternative text in case an image can't be displayed.
    border?: IBorderType; // The border width.
    crossOrigin?: ICrossoriginType; // How the element handles cross-origin requests
    height?: IHeightType; // Specifies the height of elements listed here. For all other elements, use the CSS height property.
    isMap?: IIsmapType; // Indicates that the image is part of a server-side image map.
    sizes?: ISizesType;
    src?: ISrcType; // The URL of the embeddable content.
    srcSet?: ISrcsetType;
    width?: IWidthType; // For the elements listed here, this establishes the element's width.
}

interface ITableAttributes extends IHtmlAttributes {
    align?: IAlignType; // Specifies the horizontal alignment of the element.
    bgColor?: IBgcolorType; // Background color of the element.
    border?: IBorderType; // The border width.
    summary?: ISummaryType;
}

interface ITbodyAttributes extends IHtmlAttributes {
    align?: IAlignType; // Specifies the horizontal alignment of the element.
}

interface ITdAttributes extends IHtmlAttributes {
    align?: IAlignType; // Specifies the horizontal alignment of the element.
}

interface ITfootAttributes extends IHtmlAttributes {
    align?: IAlignType; // Specifies the horizontal alignment of the element.
}

interface IThAttributes extends IHtmlAttributes {
    align?: IAlignType; // Specifies the horizontal alignment of the element.
    bgColor?: IBgcolorType; // Background color of the element.
    colSpan?: IColspanType; // The colspan attribute defines the number of columns a cell should span.
    headers?: IHeadersType; // IDs of the <th> elements which applies to this element.
    rowSpan?: IRowspanType; // Defines the number of rows a table cell should span over.
    scope?: IScopeType;
}

interface ITheadAttributes extends IHtmlAttributes {
    align?: IAlignType; // Specifies the horizontal alignment of the element.
}

interface ITrAttributes extends IHtmlAttributes {
    align?: IAlignType; // Specifies the horizontal alignment of the element.
    bgColor?: IBgcolorType; // Background color of the element.
}

interface IAreaAttributes extends IHtmlAttributes {
    alt?: IAltType; // Alternative text in case an image can't be displayed.
    coords?: ICoordsType; // A set of values specifying the coordinates of the hot-spot region.
    download?: IDownloadType; // Indicates that the hyperlink is to be used for downloading a resource.
    href?: IHrefType; //  The URL of a linked resource.
    hrefLang?: IHreflangType; // Specifies the language of the linked resource.
    media?: IMediaType; // Specifies a hint of the media for which the linked resource was designed.
    ping?: IPingType;
    rel?: IRelType; // Specifies the relationship of the target object to the link object.
    shape?: IShapeType;
    target?: ITargetType;
}

interface IScriptAttributes extends IHtmlAttributes {
    async?: IAsyncType; // Indicates that the script should be executed asynchronously.
    charset?: ICharsetType; // Declares the character encoding of the page or script.
    crossOrigin?: ICrossoriginType; // How the element handles cross-origin requests
    defer?: IDeferType; // Indicates that the script should be executed after the page has been parsed.
    language?: ILanguageType; // Defines the script language used in the element.
    src?: ISrcType; // The URL of the embeddable content.
    type?: ITypeType; // Defines the type of the element.
}

interface IButtonAttributes extends IHtmlAttributes {
    autoFocus?: IAutofocusType; // The element should be automatically focused after the page loaded.
    disabled?: IDisabledType; // Indicates whether the user can interact with the element.
    form?: IFormType; // Indicates the form that is the owner of the element.
    formAction?: IFormactionType; // Indicates the action of the element, overriding the action defined in the <form>.
    name?: INameType; // Name of the element. For example used by the server to identify the fields in form submits.
    type?: ITypeType; // Defines the type of the element.
    value?: IValueType; // Defines a default value which will be displayed in the element on page load.
}

interface IKeygenAttributes extends IHtmlAttributes {
    autoFocus?: IAutofocusType; // The element should be automatically focused after the page loaded.
    challenge?: IChallengeType; // A challenge string that is submitted along with the public key.
    disabled?: IDisabledType; // Indicates whether the user can interact with the element.
    form?: IFormType; // Indicates the form that is the owner of the element.
    keyType?: IKeytypeType; // Specifies the type of key generated.
    name?: INameType; // Name of the element. For example used by the server to identify the fields in form submits.
}

interface ISelectAttributes extends IHtmlAttributes {
    autoFocus?: IAutofocusType; // The element should be automatically focused after the page loaded.
    disabled?: IDisabledType; // Indicates whether the user can interact with the element.
    form?: IFormType; // Indicates the form that is the owner of the element.
    multiple?: IMultipleType; // Indicates whether multiple values can be entered in an input of the type email or file.
    name?: INameType; // Name of the element. For example used by the server to identify the fields in form submits.
    required?: IRequiredType; // Indicates whether this element is required to fill out or not.
    size?: ISizeType; // Defines the width of the element (in pixels). If the element's type attribute is text or password then it's the number of characters.
}

interface ITextareaAttributes extends IHtmlAttributes {
    autoFocus?: IAutofocusType; // The element should be automatically focused after the page loaded.
    cols?: IColsType; // Defines the number of columns in a textarea.
    dirname?: IDirnameType;
    disabled?: IDisabledType; // Indicates whether the user can interact with the element.
    form?: IFormType; // Indicates the form that is the owner of the element.
    maxLength?: IMaxlengthType; // Defines the maximum number of characters allowed in the element.
    minLength?: IMinlengthType; // Defines the minimum number of characters allowed in the element.
    name?: INameType; // Name of the element. For example used by the server to identify the fields in form submits.
    placeholder?: IPlaceholderType; // Provides a hint to the user of what can be entered in the field.
    readonly?: IReadonlyType; // Indicates whether the element can be edited.
    required?: IRequiredType; // Indicates whether this element is required to fill out or not.
    rows?: IRowsType; // Defines the number of rows in a text area.
    wrap?: IWrapType; // Indicates whether the text should be wrapped.
}

interface IAudioAttributes extends IHtmlAttributes {
    autoPlay?: IAutoplayType; // The audio or video should play as soon as possible.
    buffered?: IBufferedType; // Contains the time range of already buffered media.
    controls?: IControlsType; // Indicates whether the browser should show playback controls to the user.
    crossOrigin?: ICrossoriginType; // How the element handles cross-origin requests
    loop?: ILoopType; // Indicates whether the media should start playing from the start when it's finished.
    muted?: IMutedType; // Indicates whether the audio will be initially silenced on page load.
    preload?: IPreloadType; // Indicates whether the whole resource, parts of it or nothing should be preloaded.
    src?: ISrcType; // The URL of the embeddable content.
}

interface IVideoAttributes extends IHtmlAttributes {
    autoPlay?: IAutoplayType; // The audio or video should play as soon as possible.
    buffered?: IBufferedType; // Contains the time range of already buffered media.
    controls?: IControlsType; // Indicates whether the browser should show playback controls to the user.
    crossOrigin?: ICrossoriginType; // How the element handles cross-origin requests
    height?: IHeightType; // Specifies the height of elements listed here. For all other elements, use the CSS height property.
    loop?: ILoopType; // Indicates whether the media should start playing from the start when it's finished.
    muted?: IMutedType; // Indicates whether the audio will be initially silenced on page load.
    poster?: IPosterType; // A URL indicating a poster frame to show until the user plays or seeks.
    preload?: IPreloadType; // Indicates whether the whole resource, parts of it or nothing should be preloaded.
    src?: ISrcType; // The URL of the embeddable content.
    width?: IWidthType; // For the elements listed here, this establishes the element's width.
}

interface IBodyAttributes extends IHtmlAttributes {
    bgColor?: IBgcolorType; // Background color of the element.
}

interface IColGroupAttributes extends IHtmlAttributes {
    bgColor?: IBgcolorType; // Background color of the element.
    span?: ISpanType;
}

interface IMarqueeAttributes extends IHtmlAttributes {
    bgColor?: IBgcolorType; // Background color of the element.
    loop?: ILoopType; // Indicates whether the media should start playing from the start when it's finished.
}

interface ITBodyAttributes extends IHtmlAttributes {
    bgColor?: IBgcolorType; // Background color of the element.
}

interface ITFootAttributes extends IHtmlAttributes {
    bgColor?: IBgcolorType; // Background color of the element.
}

interface ITdAttributes extends IHtmlAttributes {
    bgColor?: IBgcolorType; // Background color of the element.
    colSpan?: IColspanType; // The colspan attribute defines the number of columns a cell should span.
    headers?: IHeadersType; // IDs of the <th> elements which applies to this element.
    rowSpan?: IRowspanType; // Defines the number of rows a table cell should span over.
}

interface IObjectAttributes extends IHtmlAttributes {
    border?: IBorderType; // The border width.
    data?: IDataType; // Specifies the URL of the resource.
    form?: IFormType; // Indicates the form that is the owner of the element.
    height?: IHeightType; // Specifies the height of elements listed here. For all other elements, use the CSS height property.
    name?: INameType; // Name of the element. For example used by the server to identify the fields in form submits.
    type?: ITypeType; // Defines the type of the element.
    useMap?: IUsemapType;
    width?: IWidthType; // For the elements listed here, this establishes the element's width.
}

interface IMetaAttributes extends IHtmlAttributes {
    charset?: ICharsetType; // Declares the character encoding of the page or script.
    content?: IContentType; // A value associated with http-equiv or name depending on the context.
    httpEquiv?: IHttpEquivType;
    name?: INameType; // Name of the element. For example used by the server to identify the fields in form submits.
}

interface ICommandAttributes extends IHtmlAttributes {
    checked?: ICheckedType; // Indicates whether the element should be checked on page load.
    disabled?: IDisabledType; // Indicates whether the user can interact with the element.
    icon?: IIconType; // Specifies a picture which represents the command.
    radioGroup?: IRadiogroupType;
    type?: ITypeType; // Defines the type of the element.
}

interface IBlockQuoteAttributes extends IHtmlAttributes {
    cite?: ICiteType; // Contains a URI which points to the source of the quote or change.
}

interface IDelAttributes extends IHtmlAttributes {
    cite?: ICiteType; // Contains a URI which points to the source of the quote or change.
    datetime?: IDatetimeType; // Indicates the date and time associated with the element.
}

interface IInsAttributes extends IHtmlAttributes {
    cite?: ICiteType; // Contains a URI which points to the source of the quote or change.
    datetime?: IDatetimeType; // Indicates the date and time associated with the element.
}

interface IQAttributes extends IHtmlAttributes {
    cite?: ICiteType; // Contains a URI which points to the source of the quote or change.
}

interface IBaseFontAttributes extends IHtmlAttributes {
    color?: IColorType; // This attribute sets the text color using either a named color or a color specified in the hexadecimal #RRGGBB format.
}

interface IFontAttributes extends IHtmlAttributes {
    color?: IColorType; // This attribute sets the text color using either a named color or a color specified in the hexadecimal #RRGGBB format.
}

interface IHrAttributes extends IHtmlAttributes {
    color?: IColorType; // This attribute sets the text color using either a named color or a color specified in the hexadecimal #RRGGBB format.
}

interface ILinkAttributes extends IHtmlAttributes {
    crossOrigin?: ICrossoriginType; // How the element handles cross-origin requests
    href?: IHrefType; //  The URL of a linked resource.
    hrefLang?: IHreflangType; // Specifies the language of the linked resource.
    integrity?: IIntegrityType; // Security Feature that allows browsers to verify what they fetch.
    media?: IMediaType; // Specifies a hint of the media for which the linked resource was designed.
    rel?: IRelType; // Specifies the relationship of the target object to the link object.
    sizes?: ISizesType;
}

interface ITimeAttributes extends IHtmlAttributes {
    datetime?: IDatetimeType; // Indicates the date and time associated with the element.
}

interface ITrackAttributes extends IHtmlAttributes {
    default?: IDefaultType; // Indicates that the track should be enabled unless the user's preferences indicate something different.
    kind?: IKindType; // Specifies the kind of text track.
    label?: ILabelType; // Specifies a user-readable title of the text track.
    src?: ISrcType; // The URL of the embeddable content.
    srcLang?: ISrclangType;
}

interface IFieldSetAttributes extends IHtmlAttributes {
    disabled?: IDisabledType; // Indicates whether the user can interact with the element.
    form?: IFormType; // Indicates the form that is the owner of the element.
    name?: INameType; // Name of the element. For example used by the server to identify the fields in form submits.
}

interface OptGroup extends IHtmlAttributes {
    disabled?: IDisabledType; // Indicates whether the user can interact with the element.
}

interface IOptionAttributes extends IHtmlAttributes {
    disabled?: IDisabledType; // Indicates whether the user can interact with the element.
    selected?: ISelectedType; // Defines a value which will be selected on page load.
    value?: IValueType; // Defines a default value which will be displayed in the element on page load.
}

interface IAAttributes extends IHtmlAttributes {
    download?: IDownloadType; // Indicates that the hyperlink is to be used for downloading a resource.
    href: IHrefType; //  The URL of a linked resource.
    hrefLang?: IHreflangType; // Specifies the language of the linked resource.
    media?: IMediaType; // Specifies a hint of the media for which the linked resource was designed.
    ping?: IPingType;
    rel?: IRelType; // Specifies the relationship of the target object to the link object.
    shape?: IShapeType;
    target?: ITargetType;
}

interface ILabelAttributes extends IHtmlAttributes {
    for?: IForType; // Describes elements which belongs to this one.
    form?: IFormType; // Indicates the form that is the owner of the element.
}

interface IOutputAttributes extends IHtmlAttributes {
    for?: IForType; // Describes elements which belongs to this one.
    form?: IFormType; // Indicates the form that is the owner of the element.
    name?: INameType; // Name of the element. For example used by the server to identify the fields in form submits.
}

interface IMeterAttributes extends IHtmlAttributes {
    form?: IFormType; // Indicates the form that is the owner of the element.
    high?: IHighType; // Indicates the lower bound of the upper range.
    low?: ILowType; // Indicates the upper bound of the lower range.
    max?: IMaxType; // Indicates the maximum value allowed.
    min?: IMinType; // Indicates the minimum value allowed.
    optimum?: IOptimumType; // Indicates the optimal numeric value.
    value?: IValueType; // Defines a default value which will be displayed in the element on page load.
}

interface IProgressAttributes extends IHtmlAttributes {
    form?: IFormType; // Indicates the form that is the owner of the element.
    max?: IMaxType; // Indicates the maximum value allowed.
    value?: IValueType; // Defines a default value which will be displayed in the element on page load.
}

interface ICanvasAttributes extends IHtmlAttributes {
    height?: IHeightType; // Specifies the height of elements listed here. For all other elements, use the CSS height property.
    width?: IWidthType; // For the elements listed here, this establishes the element's width.
}

interface IEmbedAttributes extends IHtmlAttributes {
    height?: IHeightType; // Specifies the height of elements listed here. For all other elements, use the CSS height property.
    src?: ISrcType; // The URL of the embeddable content.
    type?: ITypeType; // Defines the type of the element.
    width?: IWidthType; // For the elements listed here, this establishes the element's width.
}

interface IBaseAttributes extends IHtmlAttributes {
    href?: IHrefType; //  The URL of a linked resource.
    target?: ITargetType;
}

interface IScriptAttributes extends IHtmlAttributes {
    integrity?: IIntegrityType; // Security Feature that allows browsers to verify what they fetch.
}

interface IBgsoundAttributes extends IHtmlAttributes {
    loop?: ILoopType; // Indicates whether the media should start playing from the start when it's finished.
}

interface ISourceAttributes extends IHtmlAttributes {
    media?: IMediaType; // Specifies a hint of the media for which the linked resource was designed.
    sizes?: ISizesType;
    src?: ISrcType; // The URL of the embeddable content.
    type?: ITypeType; // Defines the type of the element.
}

interface IStyleAttributes extends IHtmlAttributes {
    media?: IMediaType; // Specifies a hint of the media for which the linked resource was designed.
    scoped?: IScopedType;
    type?: ITypeType; // Defines the type of the element.
}

interface IMapAttributes extends IHtmlAttributes {
    name?: INameType; // Name of the element. For example used by the server to identify the fields in form submits.
}

interface IParamAttributes extends IHtmlAttributes {
    name?: INameType; // Name of the element. For example used by the server to identify the fields in form submits.
    value?: IValueType; // Defines a default value which will be displayed in the element on page load.
}

interface IDetailsAttributes extends IHtmlAttributes {
    open?: IOpenType; // Indicates whether the details will be shown on page load.
}

interface IOlAttributes extends IHtmlAttributes {
    reversed?: IReversedType; // Indicates whether the list should be displayed in a descending order instead of a ascending.
    start?: IStartType; // Defines the first number if other than 1.
}

interface IMenuAttributes extends IHtmlAttributes {
    type?: ITypeType; // Defines the type of the element.
}

interface IImgAttributes extends IHtmlAttributes {
    useMap?: IUsemapType;
}

interface IInputAttributes extends IHtmlAttributes {
    useMap?: IUsemapType;
}

interface ILiAttributes extends IHtmlAttributes {
    value?: IValueType; // Defines a default value which will be displayed in the element on page load.
}

export class A extends RocketComponent<IAAttributes> {
    render() {
        return _r('a', this.props, this.props.children)
    }
}

export class Abbr extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('abbr', this.props, this.props.children)
    }
}

export class Acronym extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('acronym', this.props, this.props.children)
    }
}

export class Address extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('address', this.props, this.props.children)
    }
}

export class Applet extends RocketComponent<IAppletAttributes> {
    render() {
        return _r('applet', this.props, this.props.children)
    }
}

export class Area extends RocketComponent<IAreaAttributes> {
    render() {
        return _r('area', this.props, this.props.children)
    }
}

export class Article extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('article', this.props, this.props.children)
    }
}

export class Aside extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('aside', this.props, this.props.children)
    }
}

export class Audio extends RocketComponent<IAudioAttributes> {
    render() {
        return _r('audio', this.props, this.props.children)
    }
}

export class B extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('b', this.props, this.props.children)
    }
}

export class Base extends RocketComponent<IBaseAttributes> {
    render() {
        return _r('base', this.props, this.props.children)
    }
}

export class Basefont extends RocketComponent<IBaseFontAttributes> {
    render() {
        return _r('basefont', this.props, this.props.children)
    }
}

export class Bdi extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('bdi', this.props, this.props.children)
    }
}

export class Bdo extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('bdo', this.props, this.props.children)
    }
}

export class Bgsound extends RocketComponent<IBgsoundAttributes> {
    render() {
        return _r('bgsound', this.props, this.props.children)
    }
}

export class Big extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('big', this.props, this.props.children)
    }
}

export class Blink extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('blink', this.props, this.props.children)
    }
}

export class BlockQuote extends RocketComponent<IBlockQuoteAttributes> {
    render() {
        return _r('blockquote', this.props, this.props.children)
    }
}

export class Body extends RocketComponent<IBodyAttributes> {
    render() {
        return _r('body', this.props, this.props.children)
    }
}

export class Br extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('br', this.props, this.props.children)
    }
}

export class Button extends RocketComponent<IButtonAttributes> {
    render() {
        return _r('button', this.props, this.props.children)
    }
}

export class Canvas extends RocketComponent<ICanvasAttributes> {
    render() {
        return _r('canvas', this.props, this.props.children)
    }
}

export class Caption extends RocketComponent<ICaptionAttributes> {
    render() {
        return _r('caption', this.props, this.props.children)
    }
}

export class Center extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('center', this.props, this.props.children)
    }
}

export class Cite extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('cite', this.props, this.props.children)
    }
}

export class Code extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('code', this.props, this.props.children)
    }
}

export class Col extends RocketComponent<IColAttributes> {
    render() {
        return _r('col', this.props, this.props.children)
    }
}

export class Colgroup extends RocketComponent<IColGroupAttributes> {
    render() {
        return _r('colgroup', this.props, this.props.children)
    }
}

export class Command extends RocketComponent<ICommandAttributes> {
    render() {
        return _r('command', this.props, this.props.children)
    }
}

export class Content extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('content', this.props, this.props.children)
    }
}

export class Data extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('data', this.props, this.props.children)
    }
}

export class Datalist extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('datalist', this.props, this.props.children)
    }
}

export class Dd extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('dd', this.props, this.props.children)
    }
}

export class Del extends RocketComponent<IDelAttributes> {
    render() {
        return _r('del', this.props, this.props.children)
    }
}

export class Details extends RocketComponent<IDetailsAttributes> {
    render() {
        return _r('details', this.props, this.props.children)
    }
}

export class Dfn extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('dfn', this.props, this.props.children)
    }
}

export class Dialog extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('dialog', this.props, this.props.children)
    }
}

export class Dir extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('dir', this.props, this.props.children)
    }
}

export class Div extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('div', this.props, this.props.children)
    }
}

export class Dl extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('dl', this.props, this.props.children)
    }
}

export class Dt extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('dt', this.props, this.props.children)
    }
}

export class Element extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('element', this.props, this.props.children)
    }
}

export class Em extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('em', this.props, this.props.children)
    }
}

export class Embed extends RocketComponent<IEmbedAttributes> {
    render() {
        return _r('embed', this.props, this.props.children)
    }
}

export class FieldSet extends RocketComponent<IFieldSetAttributes> {
    render() {
        return _r('fieldset', this.props, this.props.children)
    }
}

export class FigCaption extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('figcaption', this.props, this.props.children)
    }
}

export class Figure extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('figure', this.props, this.props.children)
    }
}

export class Font extends RocketComponent<IFontAttributes> {
    render() {
        return _r('font', this.props, this.props.children)
    }
}

export class Footer extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('footer', this.props, this.props.children)
    }
}

export class Form extends RocketComponent<IFormAttributes> {
    render() {
        return _r('form', this.props, this.props.children)
    }
}

export class Frame extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('frame', this.props, this.props.children)
    }
}

export class Frameset extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('frameset', this.props, this.props.children)
    }
}

export class H1 extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('h1', this.props, this.props.children)
    }
}

export class H2 extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('h2', this.props, this.props.children)
    }
}

export class H3 extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('h3', this.props, this.props.children)
    }
}

export class H4 extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('h4', this.props, this.props.children)
    }
}

export class H5 extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('h5', this.props, this.props.children)
    }
}

export class H6 extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('h6', this.props, this.props.children)
    }
}

export class Head extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('head', this.props, this.props.children)
    }
}

export class Header extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('header', this.props, this.props.children)
    }
}

export class HGroup extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('hgroup', this.props, this.props.children)
    }
}

export class Hr extends RocketComponent<IHrAttributes> {
    render() {
        return _r('hr', this.props, this.props.children)
    }
}

export class Html extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('html', this.props, this.props.children)
    }
}

export class I extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('i', this.props, this.props.children)
    }
}

export class Iframe extends RocketComponent<IIframeAttributes> {
    render() {
        return _r('iframe', this.props, this.props.children)
    }
}

export class Image extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('image', this.props, this.props.children)
    }
}

export class Img extends RocketComponent<IImgAttributes> {
    render() {
        return _r('img', this.props, this.props.children)
    }
}

export class Input extends RocketComponent<IInputAttributes> {
    render() {
        return _r('input', this.props, this.props.children)
    }
}

export class Ins extends RocketComponent<IInsAttributes> {
    render() {
        return _r('ins', this.props, this.props.children)
    }
}

export class Isindex extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('isindex', this.props, this.props.children)
    }
}

export class Kbd extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('kbd', this.props, this.props.children)
    }
}

export class Keygen extends RocketComponent<IKeygenAttributes> {
    render() {
        return _r('keygen', this.props, this.props.children)
    }
}

export class Label extends RocketComponent<ILabelAttributes> {
    render() {
        return _r('label', this.props, this.props.children)
    }
}

export class Legend extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('legend', this.props, this.props.children)
    }
}

export class Li extends RocketComponent<ILiAttributes> {
    render() {
        return _r('li', this.props, this.props.children)
    }
}

export class Link extends RocketComponent<ILinkAttributes> {
    render() {
        return _r('link', this.props, this.props.children)
    }
}

export class Listing extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('listing', this.props, this.props.children)
    }
}

export class Main extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('main', this.props, this.props.children)
    }
}

export class Map extends RocketComponent<IMapAttributes> {
    render() {
        return _r('map', this.props, this.props.children)
    }
}

export class Mark extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('mark', this.props, this.props.children)
    }
}

export class Marquee extends RocketComponent<IMarqueeAttributes> {
    render() {
        return _r('marquee', this.props, this.props.children)
    }
}

export class Math extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('math', this.props, this.props.children)
    }
}

export class Menu extends RocketComponent<IMenuAttributes> {
    render() {
        return _r('menu', this.props, this.props.children)
    }
}

export class Menuitem extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('menuitem', this.props, this.props.children)
    }
}

export class Meta extends RocketComponent<IMetaAttributes> {
    render() {
        return _r('meta', this.props, this.props.children)
    }
}

export class Meter extends RocketComponent<IMeterAttributes> {
    render() {
        return _r('meter', this.props, this.props.children)
    }
}

export class Multicol extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('multicol', this.props, this.props.children)
    }
}

export class Nav extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('nav', this.props, this.props.children)
    }
}

export class Nextid extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('nextid', this.props, this.props.children)
    }
}

export class Nobr extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('nobr', this.props, this.props.children)
    }
}

export class Noembed extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('noembed', this.props, this.props.children)
    }
}

export class Noframes extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('noframes', this.props, this.props.children)
    }
}

export class Noscript extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('noscript', this.props, this.props.children)
    }
}

export class Object extends RocketComponent<IObjectAttributes> {
    render() {
        return _r('object', this.props, this.props.children)
    }
}

export class Ol extends RocketComponent<IOlAttributes> {
    render() {
        return _r('ol', this.props, this.props.children)
    }
}

export class Optgroup extends RocketComponent<OptGroup> {
    render() {
        return _r('optgroup', this.props, this.props.children)
    }
}

export class Option extends RocketComponent<IOptionAttributes> {
    render() {
        return _r('option', this.props, this.props.children)
    }
}

export class Output extends RocketComponent<IOutputAttributes> {
    render() {
        return _r('output', this.props, this.props.children)
    }
}

export class P extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('p', this.props, this.props.children)
    }
}

export class Param extends RocketComponent<IParamAttributes> {
    render() {
        return _r('param', this.props, this.props.children)
    }
}

export class Picture extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('picture', this.props, this.props.children)
    }
}

export class Plaintext extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('plaintext', this.props, this.props.children)
    }
}

export class Pre extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('pre', this.props, this.props.children)
    }
}

export class Progress extends RocketComponent<IProgressAttributes> {
    render() {
        return _r('progress', this.props, this.props.children)
    }
}

export class Q extends RocketComponent<IQAttributes> {
    render() {
        return _r('q', this.props, this.props.children)
    }
}

export class Rb extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('rb', this.props, this.props.children)
    }
}

export class Rbc extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('rbc', this.props, this.props.children)
    }
}

export class Rp extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('rp', this.props, this.props.children)
    }
}

export class Rt extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('rt', this.props, this.props.children)
    }
}

export class Rtc extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('rtc', this.props, this.props.children)
    }
}

export class Ruby extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('ruby', this.props, this.props.children)
    }
}

export class S extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('s', this.props, this.props.children)
    }
}

export class Samp extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('samp', this.props, this.props.children)
    }
}

export class Script extends RocketComponent<IScriptAttributes> {
    render() {
        return _r('script', this.props, this.props.children)
    }
}

export class Section extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('section', this.props, this.props.children)
    }
}

export class Select extends RocketComponent<ISelectAttributes> {
    render() {
        return _r('select', this.props, this.props.children)
    }
}

export class Shadow extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('shadow', this.props, this.props.children)
    }
}

export class Slot extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('slot', this.props, this.props.children)
    }
}

export class Small extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('small', this.props, this.props.children)
    }
}

export class Source extends RocketComponent<ISourceAttributes> {
    render() {
        return _r('source', this.props, this.props.children)
    }
}

export class Spacer extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('spacer', this.props, this.props.children)
    }
}

export class Span extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('span', this.props, this.props.children)
    }
}

export class Strike extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('strike', this.props, this.props.children)
    }
}

export class Strong extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('strong', this.props, this.props.children)
    }
}

export class Style extends RocketComponent<IStyleAttributes> {
    render() {
        return _r('style', this.props, this.props.children)
    }
}

export class Sub extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('sub', this.props, this.props.children)
    }
}

export class Summary extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('summary', this.props, this.props.children)
    }
}

export class Sup extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('sup', this.props, this.props.children)
    }
}

export class Svg extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('svg', this.props, this.props.children)
    }
}

export class Table extends RocketComponent<ITableAttributes> {
    render() {
        return _r('table', this.props, this.props.children)
    }
}

export class Tbody extends RocketComponent<ITBodyAttributes> {
    render() {
        return _r('tbody', this.props, this.props.children)
    }
}

export class Td extends RocketComponent<ITdAttributes> {
    render() {
        return _r('td', this.props, this.props.children)
    }
}

export class Template extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('template', this.props, this.props.children)
    }
}

export class Textarea extends RocketComponent<ITextareaAttributes> {
    render() {
        return _r('textarea', this.props, this.props.children)
    }
}

export class Tfoot extends RocketComponent<ITFootAttributes> {
    render() {
        return _r('tfoot', this.props, this.props.children)
    }
}

export class Th extends RocketComponent<IThAttributes> {
    render() {
        return _r('th', this.props, this.props.children)
    }
}

export class Thead extends RocketComponent<ITheadAttributes> {
    render() {
        return _r('thead', this.props, this.props.children)
    }
}

export class Time extends RocketComponent<ITimeAttributes> {
    render() {
        return _r('time', this.props, this.props.children)
    }
}

export class Title extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('title', this.props, this.props.children)
    }
}

export class Tr extends RocketComponent<ITrAttributes> {
    render() {
        return _r('tr', this.props, this.props.children)
    }
}

export class Track extends RocketComponent<ITrackAttributes> {
    render() {
        return _r('track', this.props, this.props.children)
    }
}

export class Tt extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('tt', this.props, this.props.children)
    }
}

export class U extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('u', this.props, this.props.children)
    }
}

export class Ul extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('ul', this.props, this.props.children)
    }
}

export class Var extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('var', this.props, this.props.children)
    }
}

export class Video extends RocketComponent<IVideoAttributes> {
    render() {
        return _r('video', this.props, this.props.children)
    }
}

export class Wbr extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('wbr', this.props, this.props.children)
    }
}

export class Xmp extends RocketComponent<IHtmlAttributes> {
    render() {
        return _r('xmp', this.props, this.props.children)
    }
}
