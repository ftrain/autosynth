# ============================================================================
# TESTS
# ============================================================================

# Include Catch2 or use simple test framework
include(FetchContent)
FetchContent_Declare(
    Catch2
    GIT_REPOSITORY https://github.com/catchorg/Catch2.git
    GIT_TAG v3.4.0
)
FetchContent_MakeAvailable(Catch2)

# Test executable
add_executable(${PROJECT_NAME}_Tests
    test_engine.cpp
)

target_include_directories(${PROJECT_NAME}_Tests PRIVATE
    ${CMAKE_SOURCE_DIR}/source
    ${CMAKE_SOURCE_DIR}/source/dsp
)

target_link_libraries(${PROJECT_NAME}_Tests PRIVATE
    Catch2::Catch2WithMain
    sst-libraries
)

target_compile_definitions(${PROJECT_NAME}_Tests PRIVATE
    JUCE_STANDALONE_APPLICATION=0
)

# Register tests
include(CTest)
include(Catch)
catch_discover_tests(${PROJECT_NAME}_Tests)
