import { Button, Col, Empty, message, Modal, Row, Space, Table, Tabs, Tooltip } from 'antd'
import { CompassOutlined, ExpandOutlined, CheckCircleOutlined, MacCommandFilled, FileFilled, DollarCircleFilled } from "@ant-design/icons";
import React, { useEffect, useRef, useState } from 'react'
import { fetchPreviewCrawlDetails } from '../../../../service/Sources/sources';
import GoogleMapComponent from '../../../RealEstatePage/RealEstateDetails/GoogleMapComponent';
import { convertDateStringToYearMonthDay } from '../../../../Hooks/TimestampConverter';
import moment from 'moment';
import { t } from 'i18next';
import { handleSelectorPreviewData, handleUtilitiesName } from '../../../../Hooks/NameHandler';

const { TabPane } = Tabs;

const googleMapSize = {
    width: '100%',
    height: '450px'
};

const initIsHiddenProps = {
    description: true,
    location: true,
    ground: true,
    utilities: true,
    reasonsToInvest: true,
}

function DetailsPreview({ form, refs }: any) {
    const [previewButtonLoading, setpreviewButtonLoading] = useState(false);
    const [center, setcenter] = useState<any>();
    const [parsedDetail, setparsedDetail] = useState<any>();
    const [realEstateDetails, setrealEstateDetails] = useState<any>();
    const [resultData, setresultData] = useState<any>();
    const [realEstateId, setrealEstateId] = useState<any>();

    // For demo view
    const [isHiddenProperties, setisHiddenProperties] = useState(initIsHiddenProps);
    const descriptionRef: any = useRef(null)
    const locationRef: any = useRef(null)
    const groundRef: any = useRef(null)
    const utilitiesRef: any = useRef(null)
    const reasonsToInvestRef: any = useRef(null)

    // For price per area unit
    const [pricePerAreaUnit, setpricePerAreaUnit] = useState("");

    // For modal
    const [isModalVisible, setIsModalVisible] = useState(false);
    
    useEffect(() => {
        if (realEstateDetails) {
            handlepricePerAreaUnit(realEstateDetails.price)
        }
    }, [realEstateDetails]);

    // For demo view
    const handlepricePerAreaUnit = (currentPriceValue: number) => {
        const currentArea = realEstateDetails.area
        if (currentArea) {
            const pricePerArea = currentPriceValue / currentArea
            const isDecimal = pricePerArea % 1 !== 0
            const stringifiedPricePerArea = (isDecimal ? "~" : "") + Number(pricePerArea.toFixed(0)).toLocaleString()
            const currentAreaUnit = realEstateDetails.areaUnit === "M2" ? "m??" : realEstateDetails.areaUnit
            const pricePerAreaUnit = `${stringifiedPricePerArea} / ${currentAreaUnit}`
            setpricePerAreaUnit(pricePerAreaUnit)
        } else {
            setpricePerAreaUnit("")
        }
    }

    const handleBoxViewButton = (propertyKey: string) => {
        setisHiddenProperties((prevState: any) => ({ ...prevState, [propertyKey]: !prevState[propertyKey] }));
    }

    // For modal
    const handlePreviewButton = () => {
        const formValue = form.getFieldsValue();
        const { url, title, thumbnail, price, nameContact, mobileContact, location, images, direction, description, beds, baths, area, dateTimeFormat, startDate, endDate } = formValue
        const values: any = { url, title, thumbnail, price, nameContact, mobileContact, location, images, direction, description, beds, baths, area, dateTimeFormat, startDate, endDate }
        // change all undefined to ''
        Object.keys(values).forEach((key: any) => {
            if (values[key] == undefined) {
                values[key] = '';
            }
        })
        if (url && title && thumbnail && price && nameContact && mobileContact && location && images && description && area) {
            const formattedValues = {
                url,
                selectors: {
                    ...values,
                }
            }
            delete formattedValues.selectors.url
            executePreview(formattedValues)
        } else {
            if (!url) {
                form.setFields([
                    {
                        name: 'url',
                        errors: [`${t("please-input")} url ${t("to preview")}!`],
                    },
                ]);
                refs.articleURLInputRef.current!.focus({
                    cursor: 'end',
                })
            }
            if (!title) {
                form.setFields([
                    {
                        name: 'title',
                        errors: [`${t("please-input")} ${t("title").toLowerCase()} selector ${t("to preview")}!`],
                    },
                ]);
            }
            if (!thumbnail) {
                form.setFields([
                    {
                        name: 'thumbnail',
                        errors: [`${t("please-input")} ${t("thumbnail").toLowerCase()} selector ${t("to preview")}!`],
                    },
                ]);
            }
            if (!price) {
                form.setFields([
                    {
                        name: 'price',
                        errors: [`${t("please-input")} ${t("price").toLowerCase()} selector ${t("to preview")}!`],
                    },
                ]);
            }
            if (!nameContact) {
                form.setFields([
                    {
                        name: 'nameContact',
                        errors: [`${t("please-input")} ${t("Name Contact Selector").toLowerCase()} ${t("to preview")}!`],
                    },
                ]);
            }
            if (!mobileContact) {
                form.setFields([
                    {
                        name: 'mobileContact',
                        errors: [`${t("please-input")} ${t("Mobile Contact Selector").toLowerCase()} ${t("to preview")}!`],
                    },
                ]);
            }
            if (!location) {
                form.setFields([
                    {
                        name: 'location',
                        errors: [`${t("please-input")} ${t("location").toLowerCase()} selector ${t("to preview")}!`],
                    },
                ]);
            }
            if (!images) {
                form.setFields([
                    {
                        name: 'images',
                        errors: [`${t("please-input")} ${t("images").toLowerCase()} selector ${t("to preview")}!`],
                    },
                ]);
            }
            if (!description) {
                form.setFields([
                    {
                        name: 'description',
                        errors: [`${t("please-input")} ${t("description").toLowerCase()} selector ${t("to preview")}!`],
                    },
                ]);
            }
            if (!area) {
                form.setFields([
                    {
                        name: 'area',
                        errors: [`${t("please-input")} ${t("area").toLowerCase()} selector ${t("to preview")}!`],
                    },
                ]);
            }
        }
    }

    const executePreview = async (values: any) => {
        setpreviewButtonLoading(true);
        const response = await fetchPreviewCrawlDetails(values, setpreviewButtonLoading);
        if (response) {
            if (response.status === 200) {
                const data = response.data.data;
                const resultData = JSON.parse(response.data.result)
                setcenter({
                    lat: Number(data.latitude),
                    lng: Number(data.longitude),
                })
                setparsedDetail(JSON.parse(data.detail));
                setrealEstateDetails(data);
                setresultData(resultData);
                setrealEstateId(data.id);
                setIsModalVisible(true);
            } else {
                message.error(response.data)
            }
        } else {
            message.error(t('Can not get preview data'))
        }
    }

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleOk = () => {
        setIsModalVisible(false);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const dataSource = [
        {
            key: 'name',
            selector: t("Title Selector"),
            data: realEstateDetails?.name || t('Crawl data failed'),
            ref: refs.titleInputRef
        },
        {
            key: 'description',
            selector: t('Description Selector'),
            data: parsedDetail?.description || t('Crawl data failed'),
            ref: refs.descriptionInputRef
        },
        {
            key: 'thumbnail',
            selector: t('Thumbnail Selector'),
            data: realEstateDetails?.thumbnail || t('Crawl data failed'),
            ref: refs.thumbnailInputRef
        },
        {
            key: 'images',
            selector: t('Images Selector'),
            data: parsedDetail?.images.length ? parsedDetail?.images.join(',') : t('Crawl data failed'),
            ref: refs.imagesInputRef
        },
        {
            key: 'area',
            selector: t('Area Selector'),
            data: realEstateDetails?.area || t('Crawl data failed'),
            ref: refs.areaInputRef
        },
        {
            key: 'location',
            selector: t('Location Selector'),
            data: realEstateDetails?.location || t('Crawl data failed'),
            ref: refs.locationInputRef
        },
        {
            key: 'price',
            selector: t('Price Selector'),
            data: realEstateDetails?.price || t('Crawl data failed'),
            ref: refs.priceInputRef
        },
        {
            key: 'baths',
            selector: t('Baths Selector'),
            data: realEstateDetails?.baths || t('Crawl data failed'),
            ref: refs.bathsInputRef
        },
        {
            key: 'beds',
            selector: t('Beds Selector'),
            data: realEstateDetails?.beds || t('Crawl data failed'),
            ref: refs.bedsInputRef
        },
        {
            key: 'mobileContact',
            selector: t('Mobile Contact Selector'),
            data: parsedDetail?.contact.mobile || t('Crawl data failed'),
            ref: refs.mobileContactInputRef
        },
        {
            key: 'nameContact',
            selector: t('Name Contact Selector'),
            data: parsedDetail?.contact.name || t('Crawl data failed'),
            ref: refs.nameContactInputRef
        },
        {
            key: 'direction',
            selector: t('Direction Selector'),
            data: realEstateDetails?.direction || t('Crawl data failed'),
            ref: refs.directionInputRef
        },
        {
            key: 'startDate',
            selector: t('Start date Selector'),
            data: moment(realEstateDetails?.startDate).format("DD/MM/YYYY") || t('Crawl data failed'),
            ref: refs.startDateInputRef
        },
        {
            key: 'endDate',
            selector: t('End date Selector'),
            data: moment(realEstateDetails?.endDate).format("DD/MM/YYYY") || t('Crawl data failed'),
            ref: refs.endDateInputRef
        },
    ];

    const columns = [
        {
            title: 'Selector',
            dataIndex: 'selector',
            key: 'selector',
        },
        {
            title: t('data'),
            dataIndex: 'data',
            key: 'data',
            render: (text: any, row: any) => {
                return (
                    <>
                        {
                            text === t('Crawl data failed') || text === "Invalid date" || text === "UNKNOW" ?
                                <Tooltip title={resultData[row.key] || t("Can not get preview data")} overlayStyle={{ maxWidth: '1000px' }}>{handleSelectorPreviewData(text)}</Tooltip>
                                :
                                (
                                    text.length > 100 ?
                                        <Tooltip title={text} overlayStyle={{ maxWidth: '1000px' }}>{text.substring(0, 100)}...</Tooltip> :
                                        text
                                )
                        }
                    </>
                )
            }
        },
        {
            title: t('action'),
            dataIndex: 'action',
            key: 'action',
            render: (_: any, row: any) => {
                return (
                    <Button
                        type="primary"
                        onClick={() => {
                            setIsModalVisible(false);
                            row.ref.current!.focus({
                                cursor: 'end',
                            });
                        }}
                    >
                        {t("Edit selectors")}
                    </Button>
                )
            }
        },
    ];

    return (
        <Space className='d-flex justify-content-center'>
            <Button type='primary' loading={previewButtonLoading} onClick={handlePreviewButton}>
                {t("preview")}
            </Button>
            <Modal
                title={t("Preview Article Content")}
                visible={isModalVisible}
                centered
                onOk={handleOk}
                onCancel={handleCancel}
                width={1400}
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        {t("Close")}
                    </Button>,
                ]}
                className='modal-preview-details'
            >
                <Tabs defaultActiveKey="1" centered>
                    <TabPane tab={t("Simple")} key="1">
                        <Table
                            dataSource={dataSource}
                            columns={columns}
                            pagination={false}
                        />
                    </TabPane>
                    <TabPane tab={t("Demo view")} key="2">
                        {/* Carousel */}
                        {
                            parsedDetail && parsedDetail.images.length
                                ?
                                <section>
                                    <div className='border'>
                                        <div id="carouselExampleIndicatorsPreview" className="carousel slide" data-bs-ride="carousel">
                                            <div className="carousel-indicators">
                                                {
                                                    parsedDetail?.images.map((imageLink: string, index: any) => {
                                                        return (
                                                            index === 0 ?
                                                                <button key={index} type="button" data-bs-target="#carouselExampleIndicatorsPreview" data-bs-slide-to="0" aria-label="Slide 1" className="active" aria-current="true"></button>
                                                                :
                                                                <button key={index} type="button" data-bs-target="#carouselExampleIndicatorsPreview" data-bs-slide-to={`${index}`} aria-label={`Slide ${index + 1}`}></button>
                                                        )
                                                    })
                                                }
                                            </div>
                                            <div className="carousel-inner">
                                                {
                                                    parsedDetail?.images.map((imageLink: string, index: any) =>
                                                        <div key={index} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
                                                            <img src={imageLink} className="d-block w-100" style={{ height: '650px' }} />
                                                        </div>
                                                    )
                                                }
                                            </div>
                                            <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicatorsPreview" data-bs-slide="prev">
                                                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                                <span className="visually-hidden">Previous</span>
                                            </button>
                                            <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicatorsPreview" data-bs-slide="next">
                                                <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                                <span className="visually-hidden">Next</span>
                                            </button>
                                        </div>
                                        <div className='d-flex p-2' style={{ overflowX: 'auto' }}>
                                            {
                                                parsedDetail?.images.map((imageLink: string, index: any) =>
                                                    <img
                                                        key={index}
                                                        src={imageLink}
                                                        role='button'
                                                        data-bs-target="#carouselExampleIndicatorsPreview"
                                                        data-bs-slide-to={`${index}`}
                                                        aria-label={`Slide ${index + 1}`}
                                                        width={170.8}
                                                        style={{ marginLeft: `${index === 0 ? '0' : '10px'}`, maxHeight: '127.77px' }}
                                                    />
                                                )
                                            }
                                        </div>
                                    </div>
                                </section>
                                :
                                <Empty
                                    description={
                                        <span>
                                            {t("No images available")}
                                        </span>
                                    }
                                >
                                </Empty>
                        }
                        {/* Title and general details */}
                        <section>
                            <p className='mt-4'><strong>M?? tin:</strong> {realEstateId}</p>
                            <h4 className='mt-3 title textHasUnderline'>{realEstateDetails?.name}</h4>
                            <div className="d-flex align-items-center">
                                <div className='me-5'>
                                    <span className="price price-format fs-5 lh-1 fw-bold">{realEstateDetails?.price.toLocaleString()} {realEstateDetails?.currency}</span>
                                </div>
                                <div className='me-5'>Gi?? g???p: {pricePerAreaUnit}</div>
                                {
                                    realEstateDetails?.isBot &&
                                    <>
                                        <Tooltip placement="topLeft" title={`${t("go-to")} ${realEstateDetails?.source}`}>
                                            <a href={realEstateDetails?.source} target="_blank">Ngu???n</a>
                                        </Tooltip>
                                    </>
                                }
                            </div>
                            <div className="my-3"><span style={{ fontWeight: '600' }}>?????a ch???: </span>{[realEstateDetails?.location, realEstateDetails?.ward?.nameWithType, realEstateDetails?.district?.nameWithType, realEstateDetails?.province?.nameWithType].join(", ")}</div>
                            <div className="basicInfo py-2" style={{ borderTop: '1px solid rgb(188, 190, 192)', borderBottom: '1px solid rgb(188, 190, 192)' }}>
                                <div className="row g-0 fw-600">
                                    <div className="col-md-2 col-6 item">
                                        <div className="mb-1">Ph??ng ng???:</div>
                                        <div className="d-flex align-items-center"><i className="las la-bed icon"></i>{realEstateDetails?.beds}</div>
                                    </div>
                                    <div className="col-md-2 col-6 item">
                                        <div className="mb-1">Ph??ng t???m</div>
                                        <div className="d-flex align-items-center"><i className="las la-bath icon"></i>{realEstateDetails?.baths}</div>
                                    </div>
                                    <div className="col-md-2 col-6 item">
                                        <div className="mb-1">Di???n t??ch</div>
                                        <div className="d-flex align-items-center">
                                            <ExpandOutlined className="me-1" />{realEstateDetails?.area} {realEstateDetails?.areaUnit}
                                        </div>
                                    </div>
                                    <div className="col-md-2 col-6 item">
                                        <div className="mb-1">H?????ng</div>
                                        <div className="d-flex align-items-center"><CompassOutlined className="me-1" />{realEstateDetails?.direction}</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* T???ng quan */}
                        <section className='mt-4'>
                            <h4 className='mt-3 title textHasUnderline'>T???ng quan</h4>
                            <div className='border p-3'>
                                <div ref={descriptionRef} className={descriptionRef?.current?.clientHeight >= 200 && isHiddenProperties.description ? "box-body" : ""}>
                                    <div className='d-flex justify-content-center'>
                                        <img className='w-100' src={realEstateDetails?.thumbnail} alt="" />
                                    </div>
                                    <div className='text-center mt-2 fst-italic'>
                                        ???nh gi???i thi???u {realEstateDetails?.name}
                                    </div>
                                    <div
                                        className='mt-3 mb-4'
                                        dangerouslySetInnerHTML={{ __html: parsedDetail?.description }}
                                    />
                                </div>
                                {
                                    descriptionRef?.current?.clientHeight >= 200 &&
                                    <div className='d-flex justify-content-center mt-3'>
                                        <Button className='view-more-button' onClick={() => handleBoxViewButton("description")}>{isHiddenProperties.description ? "Xem th??m" : "Thu g???n"}</Button>
                                    </div>
                                }
                            </div>
                        </section>

                        {/* CHI TI???T B???T ?????NG S???N */}
                        <section className='mt-4'>
                            <h4 className='mt-3 title textHasUnderline'>CHI TI???T B???T ?????NG S???N</h4>
                            <div className="row">
                                <div className="col-md-6">
                                    <table className="table table-bordered sm table-overview">
                                        <tbody>
                                            <tr>
                                                <th>Ph??ng ng???</th>
                                                <td className="text-end">{realEstateDetails?.beds}</td>
                                            </tr>
                                            <tr>
                                                <th>Chi???u d??i</th>
                                                <td className="text-end">{parsedDetail?.length || "-"}</td>
                                            </tr>
                                            <tr>
                                                <th>Di???n t??ch ?????t</th>
                                                <td className="text-end">{realEstateDetails?.area} {realEstateDetails?.areaUnit}</td>
                                            </tr>
                                            <tr>
                                                <th>H?????ng</th>
                                                <td className="text-end">{realEstateDetails?.direction}</td>
                                            </tr>
                                            <tr>
                                                <th>Hi???n tr???ng nh??</th>
                                                <td className="text-end">{parsedDetail?.condition || "-"}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="col-md-6">
                                    <table className="table table-bordered sm table-overview">
                                        <tbody>
                                            <tr>
                                                <th>Ph??ng t???m</th>
                                                <td className="text-end">{realEstateDetails?.baths}</td>
                                            </tr>
                                            <tr>
                                                <th>Chi???u r???ng</th>
                                                <td className="text-end">{parsedDetail?.width || "-"}</td>
                                            </tr>
                                            <tr>
                                                <th>Di???n t??ch s??? d???ng</th>
                                                <td className="text-end">{parsedDetail?.usageArea || "-"}</td>
                                            </tr>
                                            <tr>
                                                <th>????? r???ng m???t ti???n ???????ng</th>
                                                <td className="text-end">{parsedDetail?.facade || "-"}</td>
                                            </tr>
                                            <tr>
                                                <th>Gi???y t???</th>
                                                <td className="text-end text-uppercase fw-bold">
                                                    {realEstateDetails?.juridical === "" && <span className="fw-normal">-</span>}
                                                    {realEstateDetails?.juridical === "NONE" && <span className="">Kh??ng c??</span>}
                                                    {realEstateDetails?.juridical === "House Ownership Certificate" && <span style={{ color: "#ed0c6e" }}>S??? h???ng</span>}
                                                    {realEstateDetails?.juridical === "Land Use Rights Certificate" && <span className="text-danger">S??? ?????</span>}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* Utilities */}
                        {
                            (parsedDetail && parsedDetail.utilities && Object.keys(parsedDetail.utilities).length > 0) && (
                                <section className='mt-4'>
                                    <h4 className='mt-3 title textHasUnderline'>Ti???n ??ch xung quanh</h4>
                                    <div className='border p-3'>
                                        <div ref={utilitiesRef} className={utilitiesRef?.current?.clientHeight >= 200 && isHiddenProperties.utilities ? "box-body" : ""}>
                                            <Row>
                                                <Col span={12}>
                                                    {
                                                        parsedDetail.utilities.infrastructure &&
                                                        <div>
                                                            <div className='title-utilities fw-bold'>C?? s??? v???t ch???t</div>
                                                            <Row className='my-2'>
                                                                {
                                                                    parsedDetail.utilities.infrastructure.map((utilityName: string) => (
                                                                        <Col key={utilityName} className='d-flex align-items-center' span={12}>
                                                                            <CheckCircleOutlined className='me-2 my-2' /> {handleUtilitiesName(utilityName)}
                                                                        </Col>
                                                                    ))
                                                                }
                                                            </Row>
                                                        </div>
                                                    }
                                                    {
                                                        parsedDetail.utilities.securityAndHygiene &&
                                                        <div>
                                                            <div className='title-utilities fw-bold'>An ninh, V??? sinh</div>
                                                            <Row className='my-2'>
                                                                {
                                                                    parsedDetail.utilities.securityAndHygiene.map((utilityName: string) => (
                                                                        <Col key={utilityName} className='d-flex align-items-center' span={12}>
                                                                            <CheckCircleOutlined className='me-2 my-2' /> {handleUtilitiesName(utilityName)}
                                                                        </Col>
                                                                    ))
                                                                }
                                                            </Row>
                                                        </div>
                                                    }
                                                    {
                                                        parsedDetail.utilities.educationAndMedical &&
                                                        <div>
                                                            <div className='title-utilities fw-bold'>Y t??? gi??o d???c</div>
                                                            <Row className='my-2'>
                                                                {
                                                                    parsedDetail.utilities.educationAndMedical.map((utilityName: string) => (
                                                                        <Col key={utilityName} className='d-flex align-items-center' span={12}>
                                                                            <CheckCircleOutlined className='me-2 my-2' /> {handleUtilitiesName(utilityName)}
                                                                        </Col>
                                                                    ))
                                                                }
                                                            </Row>
                                                        </div>
                                                    }
                                                </Col>
                                                <Col span={12}>
                                                    {
                                                        parsedDetail.utilities.entertainment &&
                                                        <div>
                                                            <div className='title-utilities fw-bold'>Gi???i tr??</div>
                                                            <Row className='my-2'>
                                                                {
                                                                    parsedDetail.utilities.entertainment.map((utilityName: string) => (
                                                                        <Col key={utilityName} className='d-flex align-items-center' span={12}>
                                                                            <CheckCircleOutlined className='me-2 my-2' /> {handleUtilitiesName(utilityName)}
                                                                        </Col>
                                                                    ))
                                                                }
                                                            </Row>
                                                        </div>
                                                    }
                                                    {
                                                        parsedDetail.utilities.consumptionAndCuisine &&
                                                        <div>
                                                            <div className='title-utilities fw-bold'>Ti??u d??ng, ???m th???c</div>
                                                            <Row className='my-2'>
                                                                {
                                                                    parsedDetail.utilities.consumptionAndCuisine.map((utilityName: string) => (
                                                                        <Col key={utilityName} className='d-flex align-items-center' span={12}>
                                                                            <CheckCircleOutlined className='me-2 my-2' /> {handleUtilitiesName(utilityName)}
                                                                        </Col>
                                                                    ))
                                                                }
                                                            </Row>
                                                        </div>
                                                    }
                                                    {
                                                        parsedDetail.utilities.sport &&
                                                        <div>
                                                            <div className='title-utilities fw-bold'>Th??? thao</div>
                                                            <Row className='my-2'>
                                                                {
                                                                    parsedDetail.utilities.sport.map((utilityName: string) => (
                                                                        <Col key={utilityName} className='d-flex align-items-center' span={12}>
                                                                            <CheckCircleOutlined className='me-2 my-2' /> {handleUtilitiesName(utilityName)}
                                                                        </Col>
                                                                    ))
                                                                }
                                                            </Row>
                                                        </div>
                                                    }
                                                </Col>
                                            </Row>
                                            {
                                                parsedDetail?.utilities.detailUtility &&
                                                <div
                                                    className='mt-3 mb-4'
                                                    style={{ overflowX: 'auto' }}
                                                    dangerouslySetInnerHTML={{ __html: parsedDetail?.utilities.detailUtility }}
                                                />
                                            }
                                        </div>
                                        {
                                            utilitiesRef?.current?.clientHeight >= 200 &&
                                            <div className='d-flex justify-content-center mt-3'>
                                                <Button className='view-more-button' onClick={() => handleBoxViewButton("utilities")}>{isHiddenProperties.utilities ? "Xem th??m" : "Thu g???n"}</Button>
                                            </div>
                                        }
                                    </div>
                                </section>
                            )
                        }

                        {/* Location */}
                        <section className='mt-4'>
                            <h4 className='mt-3 title textHasUnderline'>V??? tr?? b???t ?????ng s???n</h4>
                            <div className='border p-3'>
                                <div ref={locationRef} className={locationRef?.current?.clientHeight >= 200 && isHiddenProperties.location ? "box-body" : ""}>
                                    <div className='d-flex justify-content-center'>
                                        {
                                            center &&
                                            <GoogleMapComponent center={center} googleMapSize={googleMapSize} />
                                        }
                                    </div>
                                    <div
                                        className='mt-3 mb-4'
                                        style={{ overflowX: 'auto' }}
                                        dangerouslySetInnerHTML={{ __html: parsedDetail?.locationDetail }}
                                    />
                                </div>
                                {
                                    locationRef?.current?.clientHeight >= 200 &&
                                    <div className='d-flex justify-content-center mt-3'>
                                        <Button className='view-more-button' onClick={() => handleBoxViewButton("location")}>{isHiddenProperties.location ? "Xem th??m" : "Thu g???n"}</Button>
                                    </div>
                                }
                            </div>
                        </section>

                        {/* Ground */}
                        {
                            parsedDetail && parsedDetail.ground && (
                                <section className='mt-4'>
                                    <h4 className='mt-3 title textHasUnderline'>M???T B???NG B???T ?????NG S???N</h4>
                                    <div className='border p-3'>
                                        <div ref={groundRef} className={groundRef?.current?.clientHeight >= 200 && isHiddenProperties.ground ? "box-body" : ""}>
                                            <div
                                                className='mt-3 mb-4'
                                                style={{ overflowX: 'auto' }}
                                                dangerouslySetInnerHTML={{ __html: parsedDetail?.ground }}
                                            />
                                        </div>
                                        {
                                            groundRef?.current?.clientHeight >= 200 &&
                                            <div className='d-flex justify-content-center mt-3'>
                                                <Button className='view-more-button' onClick={() => handleBoxViewButton("ground")}>{isHiddenProperties.ground ? "Xem th??m" : "Thu g???n"}</Button>
                                            </div>
                                        }
                                    </div>
                                </section>
                            )
                        }

                        {/* Reasons to invest */}
                        {
                            parsedDetail && parsedDetail.reasonsToInvest && (
                                <section className='mt-4'>
                                    <h4 className='mt-3 title textHasUnderline'>L?? DO N??N ?????U T??</h4>
                                    <div className='border p-3'>
                                        <div ref={reasonsToInvestRef} className={reasonsToInvestRef?.current?.clientHeight >= 200 && isHiddenProperties.reasonsToInvest ? "box-body" : ""}>
                                            <div
                                                className='mt-3 mb-4'
                                                style={{ overflowX: 'auto' }}
                                                dangerouslySetInnerHTML={{ __html: parsedDetail?.reasonsToInvest }}
                                            />
                                        </div>
                                        {
                                            reasonsToInvestRef?.current?.clientHeight >= 200 &&
                                            <div className='d-flex justify-content-center mt-3'>
                                                <Button className='view-more-button' onClick={() => handleBoxViewButton("reasonsToInvest")}>{isHiddenProperties.reasonsToInvest ? "Xem th??m" : "Thu g???n"}</Button>
                                            </div>
                                        }
                                    </div>
                                </section>
                            )
                        }

                    </TabPane>
                </Tabs>
            </Modal>
        </Space>
    )
}

export default DetailsPreview